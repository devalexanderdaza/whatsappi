import { UserFacingSocketConfig, WASocket } from '@adiwajshing/baileys';

import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import { DataSource } from 'typeorm';

/**
 * Interface for new Whatsappi options
 */
export interface WhatsappiOptions {
  sessionId?: string;
  sessionName: string;
  sessionToken?: string;
  webhookUrl?: string;
  restartable?: boolean;
  printQRinTerminal?: boolean;
  markOnlineOnConnect?: boolean;
  ignoreBroadcastMessages?: boolean;
  ignoreGroupMessages?: boolean;
  ignoreServerAck?: boolean;
  syncFullHistory?: boolean;
}

/**
 * Interface for Whatsappi instance
 * @interface
 * @property {WhatsappiOptions} instanceOptions - Instance options
 * @property {DataSource} whatsappiDatabase - Instance database
 * @property {UserFacingSocketConfig} socketOptions - Instance socket options
 * @property {WASocket} socket - Instance socket
 * @property {StoreHandle} store - Instance store
 * @property {StoreHandle} getStore - Instance getStore
 * @property {Function} onQRUpdate - Instance onQRUpdate
 * @property {Function} onQRScanned - Instance onQRScanned
 * @property {Function} onLoggedIn - Instance onLoggedIn
 * @property {Function} onEvent - Instance onEvent
 */
export interface WhatsappiInstance {
  instanceOptions: WhatsappiOptions;
  whatsappiDatabase: DataSource;
  socketOptions: UserFacingSocketConfig;
  socket: WASocket;
  store: StoreHandle;
  getStore: StoreHandle;
  onQRUpdate: (callback: (qr: string) => void) => void;
  onQRScanned: (callback: () => void) => void;
  onLoggedIn: (callback: () => void) => void;
  onEvent: (event: string, cb: any) => void;
}
