/* eslint-disable @typescript-eslint/ban-types */
import makeWASocket, {
  AnyMessageContent,
  Contact,
  DisconnectReason,
  proto,
  useMultiFileAuthState,
  UserFacingSocketConfig,
  downloadMediaMessage,
} from '@adiwajshing/baileys';
import { Boom } from '@hapi/boom';
import {
  WhatsappiProps,
  IWhatsappi,
  IExistenceOnWhatsApp,
  IListMessageDefinitions,
} from './interfaces';
import MAINLOGGER from 'pino';
import Qrcode from 'qrcode';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 } from 'uuid';
import { WhatsappiStorage } from './utils';

const logger = MAINLOGGER({
  timestamp: () => `,"time":"${new Date().toJSON()}"`,
});
logger.level = 'silent';

const normalPrefix = '@s.whatsapp.net';

export const Whatsappi = async (
  initializerProps: WhatsappiProps,
): Promise<IWhatsappi> => {
  let IS_CONNECTED = false;
  initializerProps.onStatusChange('WaitinLogin');

  const StorageInitializer: WhatsappiStorage = new WhatsappiStorage({
    pathStorage: path.resolve(process.cwd(), `storage`),
    sessionName: initializerProps.sessionName,
  });

  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(
      process.cwd(),
      `storage/${initializerProps.sessionName}`,
      'sessions',
      initializerProps.sessionName,
    ),
  );

  const presetToSocket: UserFacingSocketConfig = {
    printQRInTerminal: initializerProps.qrCodeInTerminal,
    logger: logger,
    auth: state,
    browser: [
      initializerProps.agentName ? initializerProps.agentName : 'Whatsappi',
      'MacOS',
      '3.0',
    ],
  };

  const socket = makeWASocket(presetToSocket);

  socket.ev.on('connection.update', async () => {
    await saveCreds();
  });

  socket.ev.on('messages.upsert', async (message) => {
    if (message.type === 'notify') {
      if (initializerProps.IgnoreServer_ACK && message.messages[0].status === 2)
        return;

      if (
        initializerProps.IgnoreBroadCastMessages &&
        message.messages[0].key.remoteJid?.match(/@broadcast/gi)?.length
      )
        return;

      if (
        initializerProps.IgnoreGroupsMessages &&
        message.messages[0].key.remoteJid?.match(/@g.us/gi)?.length
      )
        return;

      let filename = '';

      try {
        if (message.messages) {
          const typesMediaMessage = [
            'imageMessage',
            'audioMessage',
            'videoMessage',
            'documentMessage',
            'stickerMessage',
          ];
          const messageType = Object.keys(message.messages[0].message as {})[0];

          if (typesMediaMessage.includes(messageType)) {
            const bufferData = await downloadMediaMessage(
              message.messages[0],
              'buffer',
              {},
              {
                logger,
                reuploadRequest: socket.updateMediaMessage,
              },
            );

            const thisPathExists = fs.existsSync(
              path.resolve(
                process.cwd(),
                `storage/${initializerProps.sessionName}`,
                'media',
              ),
            );

            if (!thisPathExists) {
              fs.mkdirSync(
                path.resolve(
                  process.cwd(),
                  `storage/${initializerProps.sessionName}`,
                  'media',
                ),
              );
            }

            const mimetypeFile = message.messages[0].message?.[
              messageType as keyof proto.IMessage
            ]?.['mimetype' as keyof {}] as unknown as string;

            filename = `${v4()}.${mimetypeFile.split('/')[1]}`;

            writeFile(
              path.resolve(
                process.cwd(),
                `storage/${initializerProps.sessionName}`,
                'media',
                filename,
              ),
              bufferData,
            );
          }
        }
      } catch (error: any) {
        console.log({
          log: 'Not was possible download the message',
          error: error.message,
          message: JSON.stringify(message, undefined, 2),
        });
      }

      initializerProps.onMessage(
        filename.length
          ? { ...message, fileNameDownloaded: filename }
          : message,
      );

      StorageInitializer.saveMessageInStorage(message);
    }
  });

  return new Promise((resolve) => {
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (update.qr) {
        Qrcode.toFile(
          path.resolve(
            process.cwd(),
            `storage/${initializerProps.sessionName}`,
            'qr.png',
          ),
          update.qr,
        );
      }

      if (connection === 'close') {
        IS_CONNECTED = false;
        initializerProps.onStatusChange('WaitinLogin');

        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          const client = await Whatsappi(initializerProps);
          IS_CONNECTED = true;
          resolve(client);

          return;
        }

        fs.rmSync(
          path.resolve(
            __dirname,
            '..',
            '..',
            `SessionWhatsappi_${initializerProps.sessionName}`,
          ),
          { force: true, recursive: true },
        );
        fs.rmSync(
          path.resolve(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            `SessionWhatsappi_${initializerProps.sessionName}`,
          ),
          { force: true, recursive: true },
        );

        initializerProps.onDisconnected();
      }

      if (connection === 'open') {
        IS_CONNECTED = true;
        initializerProps.onStatusChange('Connected');

        resolve({
          async replyMessage(
            number: string,
            content: string,
            quotedId: string,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const msg = await StorageInitializer.getMessageFromFakestorage(
                quotedId,
              );

              const sendReply = await socket.sendMessage(
                `${number}${normalPrefix}`,
                { text: content },
                { quoted: msg },
              );

              if (typeof sendReply === 'undefined')
                throw { message: 'Not was possible reply this message' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendReply],
              });

              return sendReply;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },

          async sendGifOrVideoMessage(
            mediaPath: string,
            number: string,
            content?: string,
            isGif?: boolean,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const optionsMedia: AnyMessageContent = {
                video: fs.readFileSync(mediaPath),
              };

              if (isGif) optionsMedia.gifPlayback = true;

              if (content) optionsMedia.caption = content;

              const sendMediaMessage = await socket.sendMessage(
                `${number}${normalPrefix}`,
                optionsMedia,
              );

              if (typeof sendMediaMessage === 'undefined')
                throw { message: 'Not was possible send video or gif now.' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendMediaMessage],
              });

              return sendMediaMessage;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },

          async logOut(): Promise<boolean> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.logout();

              return true;
            } catch {
              return false;
            }
          },

          async sendAudioMedia(
            audioPath: string,
            number: string,
            isPtt?: boolean,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const device = await StorageInitializer.getTypeDevice(
                `${number}${normalPrefix}`,
              );

              const sendAudioMedia = await socket.sendMessage(
                `${number}${normalPrefix}`,
                {
                  audio: {
                    url: audioPath,
                  },
                  ptt: isPtt ? isPtt : false,
                  mimetype: device === 'android' ? 'audio/mp4' : 'audio/mpeg',
                },
              );

              if (typeof sendAudioMedia === 'undefined')
                throw { message: 'Not was possible send audio media.' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendAudioMedia],
              });

              return sendAudioMedia;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },

          getDeviceInformation(): Contact {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              return socket.user as Contact;
            } catch {
              return {} as Contact;
            }
          },

          async verifyExistenceNumber(
            number: string,
          ): Promise<IExistenceOnWhatsApp> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const [result] = await socket.onWhatsApp(number);

              return {
                exists: result?.exists || false,
                formatedJid: result?.jid || number,
              };
            } catch {
              return {} as IExistenceOnWhatsApp;
            }
          },

          async sendListMessage(
            number: string,
            listMessage: IListMessageDefinitions,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const sendListMessage = await socket.sendMessage(
                `${number}${normalPrefix}`,
                listMessage,
              );

              if (typeof sendListMessage === 'undefined')
                throw { message: 'Not was possible send audio media.' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendListMessage],
              });

              return sendListMessage;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },

          async sendImage(
            imagePath: string,
            number: string,
            content?: string,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const optionsSenMessage: AnyMessageContent = {
                image: {
                  url: imagePath,
                },
              };

              if (content) optionsSenMessage.caption = content;

              const sendImage = await socket.sendMessage(
                `${number}${normalPrefix}`,
                optionsSenMessage,
              );

              if (typeof sendImage === 'undefined')
                throw { message: 'Not was possible send image' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendImage],
              });
              return sendImage;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },

          async blockContact(number: string): Promise<boolean> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.updateBlockStatus(
                `${number}${normalPrefix}`,
                'block',
              );

              return true;
            } catch {
              return false;
            }
          },

          async unBlockContact(number: string): Promise<boolean> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              await socket.updateBlockStatus(
                `${number}${normalPrefix}`,
                'unblock',
              );

              return true;
            } catch {
              return false;
            }
          },

          async getImageContact(
            number: string,
            isGroup: boolean,
          ): Promise<{ uri: string }> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';

              const profilePictureUrl = await socket.profilePictureUrl(
                `${number}${prefix}`,
                'image',
              );

              if (typeof profilePictureUrl === 'undefined')
                throw {
                  message:
                    'Not was possible fatch the url profile of this contact.',
                };

              return {
                uri: profilePictureUrl as string,
              };
            } catch {
              return { uri: '' };
            }
          },

          async deleteMessageForEveryone(
            number: string,
            messageId: string,
            isGroup?: boolean,
          ): Promise<boolean> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const prefix = isGroup ? '@g.us' : '@s.whatsapp.net';

              const deleteMessage = socket.sendMessage(`${number}${prefix}`, {
                delete: {
                  remoteJid: `${number}${prefix}`,
                  id: messageId,
                },
              });

              if (typeof deleteMessage === 'undefined')
                throw { message: 'Not was possible delete this message' };

              return true;
            } catch {
              return false;
            }
          },

          async sendSimpleMessage(
            content: string,
            number: string,
          ): Promise<proto.WebMessageInfo> {
            try {
              if (!IS_CONNECTED) throw { message: 'Connection is closed.' };

              const sendMessage = await socket.sendMessage(
                `${number}${normalPrefix}`,
                { text: content },
              );

              if (typeof sendMessage === 'undefined')
                throw { message: 'Not was possible send this message' };

              StorageInitializer.saveMessageInStorage({
                type: 'notify',
                messages: [sendMessage],
              });

              return sendMessage;
            } catch {
              return {} as proto.WebMessageInfo;
            }
          },
        });
      }
    });
  });
};
