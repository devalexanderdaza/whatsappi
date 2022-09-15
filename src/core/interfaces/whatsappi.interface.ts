import { Contact, MessageUpsertType, proto } from '@adiwajshing/baileys';

export interface MessagesType {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
  fileNameDownloaded?: string;
}

export interface ITypeDeviceWithMessage {
  typeDevice: string;
  message: proto.WebMessageInfo;
}

export interface WhatsappiProps {
  sessionName: string;
  agentName?: string;
  qrCodeInTerminal: boolean;
  IgnoreBroadCastMessages: boolean;
  IgnoreGroupsMessages: boolean;
  IgnoreServer_ACK: boolean;
  onMessage: (message: MessagesType) => void;
  onStatusChange: (connectionStatus: 'Connected' | 'WaitinLogin') => void;
  onDisconnected: () => void;
}

export interface IExistenceOnWhatsApp {
  exists: boolean;
  formatedJid: string;
}

export interface IListMessageDefinitions {
  text: string;
  footer?: string;
  title: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      title: string;
      rowId: string;
      description?: string;
    }>;
  }>;
}

export interface IWhatsappi {
  verifyExistenceNumber: (number: string) => Promise<IExistenceOnWhatsApp>;
  sendGifOrVideoMessage: (
    mediaPath: string,
    number: string,
    content?: string,
    isGif?: boolean,
  ) => Promise<proto.WebMessageInfo>;
  sendImage: (
    imagePath: string,
    number: string,
    content?: string,
  ) => Promise<proto.WebMessageInfo>;
  sendAudioMedia: (
    audioPath: string,
    number: string,
    isPtt?: boolean,
  ) => Promise<proto.WebMessageInfo>;
  logOut: () => Promise<boolean>;
  sendListMessage: (
    number: string,
    listMessage: IListMessageDefinitions,
  ) => Promise<proto.WebMessageInfo>;
  getDeviceInformation: () => Contact;
  blockContact: (number: string) => Promise<boolean>;
  unBlockContact: (number: string) => Promise<boolean>;
  getImageContact: (
    number: string,
    isGroup: boolean,
  ) => Promise<{ uri: string }>;
  deleteMessageForEveryone: (
    number: string,
    messageId: string,
    isGroup?: boolean,
  ) => Promise<boolean>;
  sendSimpleMessage: (
    content: string,
    number: string,
  ) => Promise<proto.WebMessageInfo>;
  replyMessage: (
    number: string,
    content: string,
    quotedId: string,
  ) => Promise<proto.WebMessageInfo>;
}
