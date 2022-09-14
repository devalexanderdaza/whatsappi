import {
  proto,
  CommonSocketConfig,
  AuthenticationState,
  MessageRetryMap,
  WAVersion,
  WABrowserDescription,
} from '@adiwajshing/baileys';
import { WhatsappiInstances } from '../../whatsappi.instances';

interface WhatsappiBaileysConfig extends Partial<CommonSocketConfig> {
  /** provide an auth state object to maintain the auth state */
  auth?: AuthenticationState;
  /** By default true, should history messages be downloaded and processed */
  downloadHistory?: boolean;
  /** marks the client as online whenever the socket successfully connects */
  markOnlineOnConnect?: boolean;
  /**
   * map to store the retry counts for failed messages;
   * used to determine whether to retry a message or not */
  msgRetryCounterMap?: MessageRetryMap;
  /** width for link preview images */
  linkPreviewImageThumbnailWidth?: number;
  /** Should Baileys ask the phone for full history, will be received async */
  syncFullHistory?: boolean;
  /** Fails the connection if the socket times out in this interval */
  connectTimeoutMs?: number;
  /** ping-pong interval for WS connection */
  keepAliveIntervalMs?: number;
  /** version to connect with */
  version?: WAVersion;
  /** override browser config */
  browser?: WABrowserDescription;
  /** should the QR be printed in the terminal */
  printQRInTerminal?: boolean;
  /** time to wait for the generation of the next QR in ms */
  qrTimeout?: number;
  /** should events be emitted for actions done by this socket connection */
  emitOwnEvents?: boolean;
  /** time to wait between sending new retry requests */
  retryRequestDelayMs?: number;
  /**
   * fetch a message from your store
   * implement this so that messages failed to send (solves the "this message can take a while" issue) can be retried
   * */
  getMessage?: (key: proto.IMessageKey) => Promise<proto.IMessage | undefined>;
}

export interface WhatsappiOptions extends WhatsappiBaileysConfig {
  sessionName: string;
  sessionKey?: string;
  sessionAccessToken?: string;
  sessionWebhook?: string | null;
  autoCloseTimeout?: number;
}

export interface WhatsappiClientsStore {
  [key: string]: WhatsappiInstances;
}
