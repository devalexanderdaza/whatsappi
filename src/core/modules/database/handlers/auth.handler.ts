/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap,
} from '@adiwajshing/baileys';
import { DataSource } from 'typeorm';
import { Auth } from '../entities';

const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
  'pre-key': 'preKeys',
  session: 'sessions',
  'sender-key': 'senderKeys',
  'app-state-sync-key': 'appStateSyncKeys',
  'app-state-sync-version': 'appStateVersions',
  'sender-key-memory': 'senderKeyMemory',
};

export class AuthHandler {
  private datasource: DataSource;
  private sessionId: string;

  constructor(datasource: DataSource, sessionId: string) {
    this.datasource = datasource;
    this.sessionId = sessionId;
  }

  useAuthHandle = async (): Promise<{
    state: AuthenticationState;
    saveState: () => void;
  }> => {
    let creds: AuthenticationCreds;
    let keys: any = {};

    const existingAuth = await this.datasource.getRepository(Auth).findOneBy({
      sessionId: this.sessionId,
      key: this.sessionId,
    });

    ({ creds, keys } = existingAuth
      ? JSON.parse(existingAuth.value, BufferJSON.reviver)
      : { creds: initAuthCreds(), keys: {} });

    const saveState = () =>
      this.datasource.getRepository(Auth).save({
        sessionId: this.sessionId,
        key: this.sessionId,
        value: JSON.stringify({ creds, keys }, BufferJSON.replacer, 2),
      });

    return {
      state: {
        creds,
        keys: {
          get: (type, ids) => {
            const key = KEY_MAP[type];
            return ids.reduce((dict, id) => {
              let value = keys[key]?.[id];
              if (value) {
                if (type === 'app-state-sync-key')
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                dict[id] = value;
              }
              return dict;
            }, {});
          },
          set: (data) => {
            for (const _key in data) {
              const key = KEY_MAP[_key as keyof SignalDataTypeMap];
              keys[key] = keys[key] || {};
              Object.assign(keys[key], data[_key]);
            }
            saveState();
          },
        },
      },
      saveState,
    };
  };
}
