import { DataSource, DataSourceOptions } from 'typeorm';
import { WhatsappiOptions } from '../../interfaces/whatsappi.interface';
import {
  Auth,
  Chat,
  Contact,
  GroupMetadata,
  Message,
  MessageDic,
  Presence,
  PresenceDic,
} from './entities';
import { AuthHandler, StoreHandler } from './handlers';
import { Instance } from './entities/instance.entity';
import { generateUUID, generateUUIDFromString } from '../../utils/global.util';
import { InstanceConnectionStatus } from '../../interfaces/instance.interface';

class DatabaseModule {
  static instance: DatabaseModule = new DatabaseModule();
  private constructor() {
    console.log('DatabaseModule created');
  }

  init = async (
    whatsappiOptions: WhatsappiOptions,
    db: DataSourceOptions,
    options?: {
      debug?: boolean;
      sync?: boolean;
    },
  ): Promise<{ auth: AuthHandler; store: StoreHandler }> => {
    const ds = await new DataSource({
      ...db,
      entities: [
        Auth,
        Chat,
        Contact,
        GroupMetadata,
        MessageDic,
        Message,
        PresenceDic,
        Presence,
        Instance,
      ],
      synchronize: options?.sync,
      migrations: [],
      logging: options?.debug,
    }).initialize();
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
    try {
      // Check if instance exists in database
      const instance = await ds.getRepository(Instance).findOne({
        where: {
          sessionId: whatsappiOptions.sessionId,
        },
      });
      if (!instance) {
        // Create new instance
        await ds.getRepository(Instance).save({
          sessionId: whatsappiOptions.sessionId,
          sessionName: whatsappiOptions.sessionName,
          sessionToken: whatsappiOptions.sessionToken,
          webhookUrl: whatsappiOptions.webhookUrl,
          restartable: whatsappiOptions.restartable,
          qrCode: undefined,
          options: whatsappiOptions,
          connectionStatus: InstanceConnectionStatus.CREATED,
        });
      }
      await ds.getRepository(Auth).find();
    } catch {
      return await this.init(whatsappiOptions, db, { sync: true, ...options });
    }
    return {
      auth: new AuthHandler(ds, whatsappiOptions.sessionId),
      store: new StoreHandler(ds, whatsappiOptions.sessionId),
    };
  };
}

export default DatabaseModule.instance.init;
export * from './entities';
export * from './handlers';
