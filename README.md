# WhatsAppi Baileys Library Wrapper

`WhatsAppi` a open-source Baileys WhatsApp API library wrapper. No puppeteer or selenium, faster than ever!
`WhatsAppi` wraps Baileys' user-bearable library into user-enjoyable library.
Simply put a client up and assign event handlers, that's it!

# Usage

## Installation

### From NPM

```sh
npm install --save @devalexanderdaza/whatsappi
```

### From YARN

```sh
yarn add @devalexanderdaza/whatsappi
```

## Power Up New Client

```js
const whatsappi = require('@devalexanderdaza/whatsappi');

// Or call using ES
import * as whatsappi from '@devalexanderdaza/whatsappi';

let config = {};
whatsappi.create('clientName', config).then((client) => {
  // When QR changed or created
  // display them on console
  client.onQRUpdated((qr) => {
    console.log(qr);
  });

  // This is when the QR has been scanned
  client.onQRScanned(() => {
    console.log('[*] QR Code scanned, logging in...');
  });

  // This is fired when new incoming/outgoing
  // messages sent. Currently, the library also
  // includes system messages
  client.onMessage((msg) => {
    console.log('[i] New message: ', msg.content);
    //msg.reply("Hello!");
  });
});

// Keep the program going
// omit this if you have other implementation
whatsappi.forever();
```

## Found an Issue?

Or simply want to add a new feature you have been dreaming of?<br>
Submit a new Issue with the correct formation and relax.

## For Developers

Want to contribute to the project? Easy,

1. Find an issue to start with
2. Fork the project
3. Make PR
4. Get merged.
