# WhatsAppi

<h1 align="center">WhatsAppi Baileys Library Wrapper</h1>
<div align="center">
<p>
<a href="https://github.com/devalexanderdaza"><img title="Author" src="https://img.shields.io/badge/Author-Alexander Daza-black.svg?style=for-the-badge&logo=github" alt=""></a>
</p>
<a href="https://github.com/devalexanderdaza?tab=followers"><img title="Followers" src="https://img.shields.io/github/followers/devalexanderdaza?color=black&style=flat-square" alt=""></a>
<a href="https://github.com/devalexanderdaza/whatsappi/stargazers"><img title="Stars" src="https://img.shields.io/github/stars/devalexanderdaza/whatsappi?color=black&style=flat-square" alt=""></a>
<a href="https://github.com/devalexanderdaza/whatsappi/network/members"><img title="Forks" src="https://img.shields.io/github/forks/devalexanderdaza/whatsappi?color=black&style=flat-square" alt=""></a>
<a href="https://github.com/devalexanderdaza/whatsappi/issues"><img title="Issues" src="https://img.shields.io/github/issues/devalexanderdaza/whatsappi?color=black&style=flat-square" alt=""></a>
<p>

<a href="http://github.com/devalexanderdaza/whatsappi"><img title="Hits" src="https://hits.dwyl.com/devalexanderdaza/whatsappi.svg?style=flat-square"></a>

</p>
<a href="https://www.buymeacoffee.com/alexanderdaza" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</div>

---

## Baileys Whatsapp library wrapper for easy integration on any NodeJS projects. This library using the latest version of @adiwajshing/baileys library for install and run

<br>

# Libraries Used

- [Baileys](https://github.com/adiwajshing/Baileys/)
- [Baileys bottle](https://github.com/deadlinecode/baileys-bottle)

# Usage

## Installation

### From NPM

```sh
npm install --save whatsappi
```

### From YARN

```sh
yarn add whatsappi
```

## Power Up New Client

```js
const whatsappi = require('whatsappi');

// Or call using ES
import {
  WhatsappiOptions,
  WhatsappiInstance,
  InstanceConnectionStatus,
  Whatsappi,
  generateUUID
} from 'whatsappi';

// New whatsappi client options
const config: WhatsappiOptions = {
  sessionId: 'whatsappi', // Optional
  sessionName: 'Whatsappi', // Required
  printQRinTerminal: true, // Optional
  ignoreBroadcastMessages: false, // Optional
  ignoreGroupMessages: false, // Optional
  ignoreServerAck: false, // Optional
  markOnlineOnConnect: false, // Optional
  syncFullHistory: true, // Optional
  restartable: true, // Optional
  webhookUrl: 'https://webhook.site/c13e9693-f22b-4531-8ee8-90d18146a2b5', // Optional
  sessionToken: generateUUID(), // Optional
};

// Create new instance of Whatsappi
const whatsappi: Whatsappi = new Whatsappi(config);

// After created instance, start the Whatsappi instance
const client: WhatsappiInstance = await whatsappi.start();

// Use the exposed methods for simplify admin the state of the client
client.onQRUpdate(async (qr: string) => {
    console.log('QR updated from callback', qr);

    // If you require update the instance in the database, is simply using typeorm
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
}
```

# Whatsappi Interfaces

## WhatsappiOptions

Options to create a new Whatsappi instance

```ts
// This is a interface of the WhatsappiOptions required to create a new client
import { WhatsappiOptions } from 'whatsappi';

export interface WhatsappiOptions {
  sessionId?: string;
  sessionName: string;
  sessionToken?: string;
  webhookUrl?: string;
  restartable?: boolean;
  printQRinTerminal?: boolean;
  markOnlineOnConnect?: boolean;
  ignoreBroadcastMessages?: boolean;
  ignoreGroupMessages?: boolean;
  ignoreServerAck?: boolean;
  syncFullHistory?: boolean;
}
```

## WhatsappiInstance

The structure of the new client created WhatsappiInstance

```ts
// This is a interface of the WhatsappiInstance clients
import { WhatsappiInstance } from 'whatsappi';

export interface WhatsappiInstance {
  instanceOptions: WhatsappiOptions;
  whatsappiDatabase: DataSource;
  socketOptions: UserFacingSocketConfig;
  socket: WASocket;
  store: StoreHandle;
  getStore: StoreHandle;
  onQRUpdate: (callback: (qr: string) => void) => void;
  onQRScanned: (callback: () => void) => void;
  onLoggedIn: (callback: () => void) => void;
  onEvent: (event: string, cb: any) => void;
}
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

# Note

I can't guarantee or can be held responsible if you get blocked or banned by using this software. WhatsApp does not allow bots using unofficial methods on their platform, so this shouldn't be considered totally safe.

# Legal

- This code is in no way affiliated, authorized, maintained, sponsored or endorsed by WA (WhatsApp) or any of its affiliates or subsidiaries.
- The official WhatsApp website can be found at https://whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.
- This is an independent and unofficial software Use at your own risk.
- Do not spam people with this.
