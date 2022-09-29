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
