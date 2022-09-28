/**
 * Interface for new Whatsappi options
 */
export interface WhatsappiOptions {
  id?: string;
  sessionId?: string;
  sessionName: string;
  printQRinTerminal?: boolean;
  ignoreBroadcastMessages: boolean;
  ignoreGroupMessages: boolean;
  ignoreServerAck: boolean;
  markOnlineOnConnect?: boolean;
  syncFullHistory?: boolean;
}
