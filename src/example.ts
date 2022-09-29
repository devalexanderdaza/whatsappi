import { Contact, WAMessage } from '@adiwajshing/baileys';

import { Whatsappi, WhatsappiOptions } from './';
import { WhatsappiInstance } from './core/interfaces/whatsappi.interface';

const whatsappiOptions: WhatsappiOptions = {
  sessionId: 'whatsappi-id',
  sessionName: 'Whatsappi',
  printQRinTerminal: true,
  ignoreBroadcastMessages: false,
  ignoreGroupMessages: false,
  ignoreServerAck: false,
  markOnlineOnConnect: false,
  syncFullHistory: true,
};

const whatsappi = new Whatsappi(whatsappiOptions);
whatsappi.start().then((instance: WhatsappiInstance) => {
  console.log('Whatsappi instance started', instance);
  const client = instance;
  client.onLoggedIn(async () => {
    console.log('Whatsappi instance logged in');
    const contacts: Contact[] = await client.getStore.contacts.all();
    console.log('Contacts', contacts);
  });
  client.onMessage((message: WAMessage) => {
    console.log('Message received', message);
  });
  client.onQRUpdate((qr: string) => {
    console.log('QR updated from callback', qr);
  });
  client.onReconnectRequested((reason) => {
    console.log('Reconnect requested', reason);
  });
});
whatsappi.onLoggedIn(() => {
  console.log('Logged in');
});
