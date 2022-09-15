import { Whatsappi } from '.';

(async () => {
  const SessionName = 'WhatsappiExample';

  const clientOne = await Whatsappi({
    sessionName: SessionName,
    qrCodeInTerminal: true,
    IgnoreBroadCastMessages: true,
    IgnoreGroupsMessages: true,
    IgnoreServer_ACK: true,
    onDisconnected: () => console.log(''),
    onStatusChange: (connectionStatus) => console.log(connectionStatus),
    onMessage: (message) => {
      console.log(JSON.stringify(message, undefined, 2));
      console.log(message);
    },
  });

  try {
    // sending a message
    console.log(
      JSON.stringify(
        await clientOne.sendSimpleMessage(
          'Sending Simple Message',
          '573203999858',
        ),
        undefined,
        2,
      ),
    );

    //replying a message
    console.log(
      JSON.stringify(
        await clientOne.replyMessage(
          '573203999858',
          'Hello, I am replying this message',
          'BAE57B9147270DE0',
        ),
        undefined,
        2,
      ),
    );

    //verifieng the existence of a number
    console.log(await clientOne.verifyExistenceNumber('573203999858'));

    //sending a list
    const sendListMessage = await clientOne.sendListMessage('573203999858', {
      text: 'Sending a list',
      buttonText: 'Click here',
      title: 'List title',
      sections: [
        {
          title: 'Section title',
          rows: [
            {
              title: 'Row title',
              rowId: 'rowId',
              description: 'Row description',
            },
          ],
        },
      ],
    });

    console.log(sendListMessage);
  } catch ({ message }) {
    console.log(message);
  }
})();
