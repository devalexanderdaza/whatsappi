import makeWASocket, {
  AuthenticationState,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  WASocket,
} from '@adiwajshing/baileys';
import log from '@adiwajshing/baileys/lib/Utils/logger';

import { Boom } from '@hapi/boom';

import AuthHandle from 'baileys-bottle/lib/bottle/AuthHandle';
import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import { DatabaseModule } from './database';
import { WhatsappiOptions } from './interfaces';

export class Whatsappi {
  /**
   * Whatsappi options
   */
  private options: WhatsappiOptions;
  private auth: AuthHandle | null = null;
  private store: StoreHandle | null = null;
  private saveState: (() => void) | null = null;
  private msgRetryCounterMap: MessageRetryMap = {};
  private socket: WASocket | null = null;

  constructor(options: WhatsappiOptions) {
    this.options = options;
    console.log('Creating new Whatsappi instance', options);
  }

  private init = async (): Promise<{
    auth: AuthHandle;
    store: StoreHandle;
  }> => {
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
  public start = async (): Promise<{
    socket: WASocket;
    store: StoreHandle;
  }> => {
    await this.init();
    const logger = log.child({});
    logger.level = 'silent';

    const { state, saveState } = await this.getState();
    this.saveState = saveState;
    const store = await this.getStore();
    console.log('State', state);
    console.log('Store', store);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const socket: WASocket = makeWASocket({
      logger,
      auth: state,
      printQRInTerminal: this.options.printQRinTerminal,
      version,
      browser: Browsers.macOS(this.options.sessionName || 'Whatsappi'),
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

    return new Promise((resolve, reject) => {
      try {
        if (!this.socket) {
          throw new Error('Socket is not initialized');
        }
        // the process function lets you process all events that just occurred
        // efficiently in a batch
        this.socket.ev.process(
          // events is a map for event name => event data
          async (events) => {
            // something about the connection changed
            // maybe it closed, or we received all offline message or connection opened
            if (events['connection.update']) {
              const update = events['connection.update'];
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
              if (connection === 'open') {
                console.log('Connection opened');
                if (this.socket && this.store) {
                  resolve({ socket: this.socket, store: this.store });
                }
              }
              console.log('connection update', update);
            }

            // credentials updated -- save them
            if (events['creds.update']) {
              if (this.saveState) {
                this.saveState();
              }
            }

            if (events.call) {
              console.log('recv call event', events.call);
            }

            // chat history received
            if (events['chats.set']) {
              const { chats, isLatest } = events['chats.set'];
              console.log(
                `recv ${chats.length} chats (is latest: ${isLatest})`,
              );
            }

            // message history received
            if (events['messages.set']) {
              const { messages, isLatest } = events['messages.set'];
              console.log(
                `recv ${messages.length} messages (is latest: ${isLatest})`,
              );
            }

            if (events['contacts.set']) {
              const { contacts, isLatest } = events['contacts.set'];
              console.log(
                `recv ${contacts.length} contacts (is latest: ${isLatest})`,
              );
            }

            // received a new message
            if (events['messages.upsert']) {
              const upsert = events['messages.upsert'];
              console.log(
                'recv messages ',
                JSON.stringify(upsert, undefined, 2),
              );
            }

            // messages updated like status delivered, message deleted etc.
            if (events['messages.update']) {
              console.log(events['messages.update']);
            }

            if (events['message-receipt.update']) {
              console.log(events['message-receipt.update']);
            }

            if (events['messages.reaction']) {
              console.log(events['messages.reaction']);
            }

            if (events['presence.update']) {
              console.log(events['presence.update']);
            }

            if (events['chats.update']) {
              console.log(events['chats.update']);
            }

            if (events['contacts.update']) {
              console.log(events['contacts.update']);
            }

            if (events['chats.delete']) {
              console.log('chats deleted ', events['chats.delete']);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  };
}
