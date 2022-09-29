import makeWASocket, {
  AuthenticationState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  UserFacingSocketConfig,
  WASocket,
} from '@adiwajshing/baileys';
import log from '@adiwajshing/baileys/lib/Utils/logger';

import { Boom } from '@hapi/boom';

import AuthHandle from 'baileys-bottle/lib/bottle/AuthHandle';
import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import { Logger } from 'pino';

import { DatabaseModule } from './database';
import { WhatsappiInstance, WhatsappiOptions } from './interfaces';

/**
 * Whatsappi class
 */
export class Whatsappi {
  /**
   * Whatsappi options
   */
  options: WhatsappiOptions;
  auth!: AuthHandle;
  store!: StoreHandle;
  state!: AuthenticationState;
  saveState!: () => void;
  msgRetryCounterMap: MessageRetryMap = {};
  logger: Logger = log.child({}) as Logger;
  socketOptions!: UserFacingSocketConfig;
  socket!: WASocket;
  whatsappiDatabase!: DatabaseModule;

  /**
   * Constructor
   * @param {WhatsappiOptions} options - Whatsappi options
   * @constructor
   * @public
   */
  constructor(options: WhatsappiOptions) {
    this.options = options;
    this.logger.level = 'silent';
  }

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
   * @returns {Promise<WhatsappiInstance>}
   */
  public start = async (): Promise<WhatsappiInstance> => {
    const logger = log.child({});
    logger.level = 'silent';

    this.whatsappiDatabase = new DatabaseModule(this.options);
    const { auth, store } = await this.whatsappiDatabase.init();
    this.auth = auth;
    this.store = store;

    const { state, saveState } = await this.getState();
    this.saveState = saveState;

    const { version, isLatest } = await fetchLatestBaileysVersion();

    this.socketOptions = {
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
    };
    const socket: WASocket = makeWASocket(this.socketOptions);
    this.socket = socket;
    if (this.store) {
      this.store.bind(this.socket.ev);
    }
    this.socket.ev.on('creds.update', () => this.saveState());
    this.socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        // reconnect if not logged out
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          this.start();
        } else {
          console.log('Connection closed. You are logged out.');
        }
      }
    });

    /**
     * Return Whatsappi instance
     */
    return new Promise((resolve, reject) => {
      try {
        if (!this.socket) {
          throw new Error('Socket is not initialized');
        } else if (!this.store) {
          throw new Error('Store is not initialized');
        } else {
          resolve({
            instanceOptions: this.options,
            whatsappiDatabase: this.whatsappiDatabase.getWhatsappiDataStore(),
            socketOptions: this.socketOptions,
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
            onQRScanned: (cb: () => void) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { connection } = update;
                if (connection === 'open') {
                  cb();
                }
              });
            },
            onLoggedIn: (cb: () => void) => {
              this.socket?.ev.on('connection.update', (update) => {
                const { connection } = update;
                if (connection === 'open') {
                  cb();
                }
              });
            },
            onEvent: (event: string, cb: any) => {
              this.socket?.ev.process(async (events) => {
                if (events[event]) {
                  await cb(events[event]);
                }
              });
            },
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  };
}

export * from './database';
export * from './utils';
