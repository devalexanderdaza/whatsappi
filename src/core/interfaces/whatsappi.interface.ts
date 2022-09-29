import {
  UserFacingSocketConfig,
  WACallEvent,
  WAMessage,
  WASocket,
} from '@adiwajshing/baileys';

import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

import EventEmitter from 'events';

import { DataSource } from 'typeorm';

import { DatabaseModule } from '../database';

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
