import { Contact, WAMessage } from '@adiwajshing/baileys';

import { Whatsappi, WhatsappiOptions } from './';
import { InstanceConnectionStatus } from './core/interfaces/instance.interface';
import { WhatsappiInstance } from './core/interfaces/whatsappi.interface';
import { Instance } from './core/database/entities/instance.entity';

const whatsappiOptions: WhatsappiOptions = {
  sessionId: 'connector',
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
  client.onQRUpdate(async (qr: string) => {
    console.log('QR updated from callback', qr);
    const instance: Instance | null = await client.whatsappiDatabase
      .getRepository(Instance)
      .findOne({
        where: {
          sessionId: client.instanceOptions.sessionId,
        },
      });
    if (instance) {
      instance.qrCode = qr;
      instance.connectionStatus = InstanceConnectionStatus.WAITING_FOR_QR;
      await client.whatsappiDatabase.getRepository(Instance).save(instance);
      console.log('QR updated in database');
      console.log(instance);
    }
  });
  client.onQRScanned(async () => {
    console.log('QR scanned from callback');
    const instance: Instance | null = await client.whatsappiDatabase
      .getRepository(Instance)
      .findOne({
        where: {
          sessionId: client.instanceOptions.sessionId,
        },
      });
    if (instance) {
      instance.qrCode = '';
      instance.connectionStatus = InstanceConnectionStatus.INITIALIZING;
      await client.whatsappiDatabase.getRepository(Instance).save(instance);
      console.log('QR scanned in database');
      console.log(instance);
    }
  });
  client.onLoggedIn(async () => {
    console.log('Logged in from callback');
    // await client.socket.sendMessage('573203999858@s.whatsapp.net', {
    //   text: 'Hello from Whatsappi',
    // });
    const instance: Instance | null = await client.whatsappiDatabase
      .getRepository(Instance)
      .findOne({
        where: {
          sessionId: client.instanceOptions.sessionId,
        },
      });
    if (instance) {
      instance.qrCode = '';
      instance.connectionStatus = InstanceConnectionStatus.CONNECTED;
      await client.whatsappiDatabase.getRepository(Instance).save(instance);
      console.log('Logged in in database');
      console.log(instance);
    }
  });
  client.onEvent('connection.update', (update: any) => {
    console.log('Connection update from callback', update);
  });
});
