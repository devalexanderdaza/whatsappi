import makeWASocket, {
  AuthenticationState,
  BaileysEvent,
  BaileysEventMap,
  BinaryNode,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  UserFacingSocketConfig,
  WAMessage,
  WASocket,
} from '@adiwajshing/baileys';
import log from '@adiwajshing/baileys/lib/Utils/logger';

import { Boom } from '@hapi/boom';

import QR from 'qrcode-terminal';

import AuthHandle from 'baileys-bottle/lib/bottle/AuthHandle';
import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import EventEmitter from 'events';

import { Logger } from 'pino';

import { DatabaseModule } from './database';
import { EventEntry, WhatsappiOptions } from './interfaces';

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
    Promise.resolve(database.init()).then(({ auth, store }) => {
      this.auth = auth;
      this.store = store;
    });
    Promise.resolve(this.auth.useAuthHandle()).then(({ state, saveState }) => {
      this.state = state;
      this.saveState = saveState;
    });
    this.socketOptions = {
      logger: this.logger,
      auth: this.state,
      printQRInTerminal: this.options.printQRinTerminal,
      markOnlineOnConnect: this.options.markOnlineOnConnect,
      syncFullHistory: this.options.syncFullHistory,
      msgRetryCounterMap: this.msgRetryCounterMap,
      qrTimeout: 30000,
      connectTimeoutMs: 60000,
      downloadHistory: true,
      linkPreviewImageThumbnailWidth: 300,
    };
    this.socket = makeWASocket(this.socketOptions);
    this.store.bind(this.socket.ev);
    console.log('Creating new Whatsappi instance', options);
  }
}

Whatsappi.prototype.query = async function query(
  node: BinaryNode,
  timeout?: number,
): Promise<BinaryNode> {
  if (!this.socket) {
    throw new Error('Socket is not initialized');
  }
  return this.socket.query(node, timeout);
};

Whatsappi.prototype.on = function on(event: string, cb: any) {
  this.socket.ev.process((events) => {
    if (events[event]) {
      this.events.push({ event, callback: cb });
      cb(events[event]);
    }
  });
};

Whatsappi.prototype.onQRUpdated = function onQRUpdated(
  cb: (qr: string, data: string | object) => void,
) {
  this.on('connection.update', ({ qr }) => {
    if (!qr) return;
    QR.generate(qr, { small: true }, function (_qr) {
      cb(_qr, qr);
    });
  });
};

Whatsappi.prototype.onQRScanned = function onQRScanned(cb: () => void) {
  this.ev.on('qrscanned', cb);
};

Whatsappi.prototype.onLoggedIn = function onLoggedIn(cb: () => void) {
  this.ev.on('loggedin', cb);
};

Whatsappi.prototype.onLoggedOut = function onLoggedOut(cb: () => void) {
  this.ev.on('loggedout', cb);
};

Whatsappi.prototype.onMessage = function onMessage(
  cb: (msg: WAMessage) => void,
) {
  this.on('messages.upsert', (msg) => {
    cb(msg);
  });
};
