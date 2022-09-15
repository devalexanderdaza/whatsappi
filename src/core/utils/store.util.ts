import fs from 'fs';
import path from 'path';
import {
  MessageUpsertType,
  proto,
  WAMessage,
  getDevice,
} from '@adiwajshing/baileys';

export class WhatsappiStorage {
  private CounterInsters: number;
  private LimitMemoryStorage: number;
  private basePath: string;
  private sessionName: string;
  private sessionPath: string;

  constructor(settings: { pathStorage: string; sessionName: string }) {
    this.LimitMemoryStorage = 0;
    this.basePath = settings.pathStorage;
    this.sessionName = settings.sessionName;
    this.sessionPath = path.resolve(this.basePath, this.sessionName);

    if (fs.existsSync(this.sessionPath)) {
      if (
        fs.existsSync(path.resolve(this.sessionPath, `MessageStorage.json`))
      ) {
        this.CounterInsters = (
          JSON.parse(
            fs.readFileSync(
              path.resolve(this.sessionPath, `MessageStorage.json`),
            ) as unknown as string,
          ) as unknown as { id: string; message: proto.IWebMessageInfo }[]
        ).length;
      } else {
        fs.writeFileSync(
          path.resolve(this.sessionPath, `MessageStorage.json`),
          '[]',
        );
        this.CounterInsters = 0;
      }
    } else {
      fs.mkdirSync(this.sessionPath, { recursive: true });
      fs.writeFileSync(
        path.resolve(this.sessionPath, `MessageStorage.json`),
        '[]',
      );
      this.CounterInsters = 0;
    }

    // TODO - Implement database connection
  }

  async getTypeDevice(numberId: string): Promise<string> {
    const dataMessages = JSON.parse(
      fs.readFileSync(
        path.resolve(this.sessionPath, `MessageStorage.json`),
      ) as unknown as string,
    ) as unknown as { id: string; message: proto.WebMessageInfo }[];

    let MessageFound = '';

    const TypeDeviceOcorrence = { web: 0, android: 0, ios: 0 };

    for (const content of dataMessages) {
      if (content.message.key.remoteJid === numberId) {
        const typefound = getDevice(content.message.key.id as string);
        TypeDeviceOcorrence[typefound]++;
      }
    }

    if (TypeDeviceOcorrence.android > 0 || TypeDeviceOcorrence.ios > 0) {
      MessageFound =
        TypeDeviceOcorrence.android > TypeDeviceOcorrence.ios
          ? 'android'
          : TypeDeviceOcorrence.ios > TypeDeviceOcorrence.android
          ? 'ios'
          : 'web';

      return MessageFound;
    }

    if (MessageFound === 'web') MessageFound = 'android';
    return !Array.from(MessageFound).length ? 'android' : MessageFound;
  }

  async SaveDataInDataBase(): Promise<void> {
    this.CounterInsters = 0;

    const dataMessages = JSON.parse(
      fs.readFileSync(
        path.resolve(this.sessionPath, `MessageStorage.json`),
      ) as unknown as string,
    ) as unknown as { id: string; message: proto.IWebMessageInfo }[];

    fs.writeFileSync(
      path.resolve(this.sessionPath, `MessageStorage.json`),
      '[]',
    );

    const dataRows = [];

    for (const message of dataMessages) {
      dataRows.push({
        message_id: message.id,
        remoteJib: message.message.key.remoteJid,
        MessageStructure: JSON.stringify(message.message),
      });
    }
  }

  saveMessageInStorage(data: {
    messages: proto.IWebMessageInfo[];
    type: MessageUpsertType;
  }): void {
    let structure = [] as { id: string; message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(
        path.resolve(this.sessionPath, `MessageStorage.json`),
      ) as unknown as string,
    ) as unknown as { id: string; message: proto.IWebMessageInfo }[];

    for (const msg of data.messages) {
      structure.push({
        id: msg.key.id as string,
        message: msg,
      });
    }

    this.CounterInsters++;

    fs.writeFileSync(
      path.resolve(this.sessionPath, `MessageStorage.json`),
      JSON.stringify(structure),
    );

    structure = [];

    if (this.LimitMemoryStorage > 0) {
      if (this.CounterInsters >= this.LimitMemoryStorage) {
        this.SaveDataInDataBase();
      }
    }
  }

  async getMessageFromFakestorage(id: string): Promise<WAMessage> {
    let structure = [] as { id: string; message: proto.IWebMessageInfo }[];

    structure = JSON.parse(
      fs.readFileSync(
        path.resolve(this.sessionPath, `MessageStorage.json`),
      ) as unknown as string,
    ) as unknown as { id: string; message: proto.IWebMessageInfo }[];

    const Message = structure.filter((val) => val.id === id);

    return Message[0].message;
  }
}
