import { Whatsappi } from '../whatsappi';

/**
 * Connection status for instances
 */
export enum InstanceConnectionStatus {
  CREATED = 'CREATED',
  INITIALIZING = 'INITIALIZING',
  WAITING_FOR_QR = 'WAITING_FOR_QR',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface EventEntry {
  event: string;
  callback: (...args: any[]) => void;
}

export type WhatsappiT = InstanceType<typeof Whatsappi>;
