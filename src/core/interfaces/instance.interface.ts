import type { WASocket } from '@adiwajshing/baileys';
import { WhatsappiOptions } from './whatsappi.interface';

export type WhatsappiInstanceStatusTypes =
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export interface WhatsappiBaileysInstance {
  sock: WASocket;
  qrCode: string | null;
}
export interface WhatsappiInstance {
  sessionId: string;
  sessionKey: string;
  whatsappiOptions: WhatsappiOptions;
  baileysInstance: WhatsappiBaileysInstance | null;
  connected: boolean;
  status: WhatsappiInstanceStatusTypes;
}
