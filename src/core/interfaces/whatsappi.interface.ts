import { WACallEvent, WAMessage, WASocket } from '@adiwajshing/baileys';

import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';

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
  socket: WASocket;
  store: StoreHandle;
  getStore: StoreHandle;
  onQRUpdate: (callback: (qr: string) => void) => void;
  onMessage: (callback: (message: WAMessage) => void) => void;
  onLoggedIn: (callback: () => void) => void;
  onDisconnected: (
    callback: (reason: {
      error: Error | undefined;
      date: Date | undefined;
    }) => void,
  ) => void;
  onReconnectRequested: (
    callback: (reason: {
      error: Error | undefined;
      date: Date | undefined;
    }) => void,
  ) => void;
  onCallReceived: (callback: (call: WACallEvent[]) => void) => void;
  logout: () => Promise<void>;
}
