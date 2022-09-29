import { Whatsappi, WhatsappiOptions } from './';

const whatsappiOptions: WhatsappiOptions = {
  sessionId: '7f69a00a-69f5-4c9e-bd39-05ebda24c451',
  sessionName: 'Whatsappi',
  printQRinTerminal: true,
  ignoreBroadcastMessages: false,
  ignoreGroupMessages: false,
  ignoreServerAck: false,
  markOnlineOnConnect: false,
  syncFullHistory: true,
};

const whatsappi = new Whatsappi(whatsappiOptions);
whatsappi.start().then(({ socket, store }) => {
  console.log('Started');
  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (connection === 'open') {
      console.log('Connected');
    }
    if (connection === 'close') {
      console.log('Disconnected');
    }
    if (qr) {
      console.log('QR Code', qr);
    }
  });
});
