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
