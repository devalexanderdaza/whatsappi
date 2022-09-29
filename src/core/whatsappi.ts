import makeWASocket, {
  AuthenticationState,
  BaileysEvent,
  BaileysEventMap,
  BinaryNode,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  proto,
  WACallEvent,
  WASocket,
} from '@adiwajshing/baileys';
import log from '@adiwajshing/baileys/lib/Utils/logger';
import { WAMessage } from '@adiwajshing/baileys';

import { Boom } from '@hapi/boom';

import QR from 'qrcode-terminal';

import AuthHandle from 'baileys-bottle/lib/bottle/AuthHandle';
import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import EventEmitter from 'events';

import { Logger } from 'pino';

import { DatabaseModule } from './database';
import { WhatsappiInstance, WhatsappiOptions } from './interfaces';

export class Whatsappi {
  /**
   * Whatsappi options
   */
  options: WhatsappiOptions;
  auth: AuthHandle = {} as AuthHandle;
  store: StoreHandle = {} as StoreHandle;
  state: AuthenticationState = undefined as any;
  saveState: () => void = undefined as any;
  msgRetryCounterMap: MessageRetryMap = {};
  logger: Logger = log.child({}) as Logger;
  socketOptions: UserFacingSocketConfig;
  socket: WASocket = undefined as any;
  ev: InstanceType<typeof EventEmitter>;
  events: Array<EventEntry> = [];
  query: (node: BinaryNode, timeout?: number) => Promise<BinaryNode> =
    undefined as any;

  on: (event: string, cb: any) => void = undefined as any;
  onQRUpdated: (cb: (qr: string, data: string | object) => void) => void =
    undefined as any;
  onQRScanned: (cb: () => void) => void = undefined as any;
  onLoggedIn: (cb: () => void) => void = undefined as any;
  onLoggedOut: (cb: () => void) => void = undefined as any;
  onMessage: (cb: (msg: WAMessage) => void) => void = undefined as any;

  constructor(options: WhatsappiOptions) {
    this.options = options;
    this.logger.level = 'silent';

    this.ev = new EventEmitter();
    const database = new DatabaseModule(this.options);
    const { auth, store } = await database.init();
    this.auth = auth;
    this.store = store;
    return { auth, store };
  };

  /**
   * Get authentication state
   * @returns {Promise<{ state: AuthenticationState; saveState: () => void }>}
   */
  private getState = async (): Promise<{
    state: AuthenticationState;
    saveState: () => void;
  }> => {
    if (!this.auth) {
      throw new Error('Auth handler is not initialized');
    }
    const { state, saveState } = await this.auth.useAuthHandle();
    return { state, saveState };
  };

  /**
   * Get store handler
   * @returns {Promise<StoreHandler>}
   * @private
   */
  private getStore = async (): Promise<StoreHandle> => {
    if (!this.store) {
      throw new Error('Store handler is not initialized');
    }
    return this.store;
  };

  /**
   * Start Whatsappi
   */
  public start = async (): Promise<WhatsappiInstance> => {
    await this.init();
    const logger = log.child({});
    logger.level = 'silent';

    const { state, saveState } = await this.getState();
    this.saveState = saveState;

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const socket: WASocket = makeWASocket({
      logger,
      auth: state,
      printQRInTerminal: this.options.printQRinTerminal,
      markOnlineOnConnect: this.options.markOnlineOnConnect,
      syncFullHistory: this.options.syncFullHistory,
      msgRetryCounterMap: this.msgRetryCounterMap,
      qrTimeout: 30000,
      connectTimeoutMs: 60000,
      downloadHistory: true,
      linkPreviewImageThumbnailWidth: 300,
    });
    this.socket = socket;
    if (this.store) {
      this.store.bind(this.socket.ev);
    }
    this.socket.ev.on('creds.update', async () => {
      if (this.saveState) {
        this.saveState();
      }
    });

    return new Promise((resolve, reject) => {
      try {
        if (!this.socket) {
          throw new Error('Socket is not initialized');
        } else if (!this.store) {
          throw new Error('Store is not initialized');
        } else {
          resolve({
            socket: this.socket,
            store: this.store,
            getStore: this.store,
            onQRUpdate: (cb: (qr: string) => void) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { qr } = update;
                if (qr) {
                  cb(qr);
                }
              });
            },
            onMessage: (cb: (message: WAMessage) => void) => {
              this.socket?.ev.on('messages.upsert', (message) =>
                cb(message[0]),
              );
            },
            onLoggedIn: (cb: () => void) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { connection } = update;
                if (connection === 'open') {
                  cb();
                }
              });
            },
            onDisconnected: (
              cb: (reason: { error: Error | undefined; date: Date }) => void,
            ) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                  if (lastDisconnect) {
                    cb(lastDisconnect);
                  }
                }
              });
            },
            onReconnectRequested: (
              cb: (reason: { error: Error | undefined; date: Date }) => void,
            ) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                  if (
                    lastDisconnect &&
                    (lastDisconnect?.error as Boom)?.output?.statusCode !==
                      DisconnectReason.loggedOut
                  ) {
                    cb(lastDisconnect);
                  }
                }
              });
            },
            onCallReceived: (cb: (call: WACallEvent[]) => void) => {
              this.socket?.ev.on('call', (call: WACallEvent[]) => {
                cb(call);
              });
            },
            logout: async () => {
              if (this.socket) {
                await this.socket.logout();
              }
            },
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  };
}
