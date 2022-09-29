import { Whatsappi, WhatsappiOptions } from './';

const whatsappiOptions: WhatsappiOptions = {
  sessionName: 'Whatsappi',
  printQRinTerminal: true,
  ignoreBroadcastMessages: false,
  ignoreGroupMessages: false,
  ignoreServerAck: false,
  markOnlineOnConnect: false,
  syncFullHistory: true,
};

const whatsappi = new Whatsappi(whatsappiOptions);
