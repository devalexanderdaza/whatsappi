import { DataSource } from 'typeorm';

import BaileysBottle from 'baileys-bottle';
import StoreHandle from 'baileys-bottle/lib/bottle/StoreHandle';
import AuthHandle from 'baileys-bottle/lib/bottle/AuthHandle';

import { cwd } from 'process';

import { InstanceConnectionStatus } from '../../interfaces/instance.interface';
import { WhatsappiOptions } from '../../interfaces/whatsappi.interface';
import { generateUUID, generateUUIDFromString } from '../../utils/global.util';

import { Instance } from './entities';

export class DatabaseModule {
  private whatsappiOptions: WhatsappiOptions;
  private databaseName: string;
  private options:
    | {
        sync?: boolean | undefined;
        debug?: boolean | undefined;
      }
    | undefined;
  private whatsappiDataStore: DataSource | null = null;
  constructor(
    whatsappiOptions: WhatsappiOptions,
    options?: {
      sync?: boolean;
      debug?: boolean;
    },
  ) {
    console.log('Database module initialized');
    // Validate wharsappiOptions
    whatsappiOptions.sessionId = whatsappiOptions.sessionId || generateUUID();
    whatsappiOptions.sessionName = whatsappiOptions.sessionName || 'default';
    whatsappiOptions.sessionToken =
      whatsappiOptions.sessionToken ||
      generateUUIDFromString(
        `${whatsappiOptions.sessionId}${whatsappiOptions.sessionName}`,
      );
    whatsappiOptions.printQRinTerminal =
      whatsappiOptions.printQRinTerminal || true;
    whatsappiOptions.markOnlineOnConnect =
      whatsappiOptions.markOnlineOnConnect || false;
    whatsappiOptions.syncFullHistory = whatsappiOptions.syncFullHistory || true;
    whatsappiOptions.restartable = whatsappiOptions.restartable || true;
    whatsappiOptions.markOnlineOnConnect =
      whatsappiOptions.markOnlineOnConnect || false;
    whatsappiOptions.webhookUrl = whatsappiOptions.webhookUrl || undefined;
    whatsappiOptions.ignoreBroadcastMessages =
      whatsappiOptions.ignoreBroadcastMessages || false;
    whatsappiOptions.ignoreGroupMessages =
      whatsappiOptions.ignoreGroupMessages || false;
    whatsappiOptions.ignoreServerAck =
      whatsappiOptions.ignoreServerAck || false;
    this.whatsappiOptions = whatsappiOptions;
    this.options = options;
    // Create new BaileysBottle
    const databaseName = `${whatsappiOptions.sessionId}.db`;
    this.databaseName = databaseName;
  }

  public init = async (): Promise<{
    auth: AuthHandle;
    store: StoreHandle;
  }> => {
    const ds = await new DataSource({
      type: 'sqlite',
      database: cwd() + `/db/whatsappi.db`,
      entities: [Instance],
      migrations: [],
      synchronize: this.options?.sync || true,
      logging: this.options?.debug || true,
    }).initialize();
    this.whatsappiDataStore = ds;

    try {
      const instanceRepository = ds.getRepository(Instance);
      const instance = await instanceRepository.findOne({
        where: {
          sessionId: this.whatsappiOptions.sessionId,
        },
      });
      if (!instance) {
        await instanceRepository.save({
          sessionId: this.whatsappiOptions.sessionId,
          sessionName: this.whatsappiOptions.sessionName,
          sessionToken: this.whatsappiOptions.sessionToken,
          webhookUrl: this.whatsappiOptions.webhookUrl,
          restartable: this.whatsappiOptions.restartable,
          qrCode: '',
          options: this.whatsappiOptions,
          connectionStatus: InstanceConnectionStatus.CREATED,
        });
      }
    } catch (error) {
      new DatabaseModule(this.whatsappiOptions, {
        ...this.options,
        sync: true,
      }).init();
    }
    const { auth, store } = await BaileysBottle({
      type: 'sqlite',
      database: cwd() + `/db/${this.databaseName}`, // (optional) path to the
    });
    return {
      auth,
      store,
    };
  };

  public getWhatsappiDataStore = (): DataSource => {
    if (!this.whatsappiDataStore) {
      throw new Error('Whatsappi data store not initialized');
    }
    return this.whatsappiDataStore;
  };

  public getWhatsappiOptions = (): WhatsappiOptions => {
    return this.whatsappiOptions;
  };

  public getDatabaseName = (): string => {
    return this.databaseName;
  };

  public getOptions = ():
    | {
        sync?: boolean | undefined;
        debug?: boolean | undefined;
      }
    | undefined => {
    return this.options;
  };
}
