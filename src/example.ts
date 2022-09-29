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
