/* eslint-disable @typescript-eslint/no-explicit-any */
import makeWASocket, {
  BaileysEventEmitter,
  ConnectionState,
  jidNormalizedUser,
  toNumber,
  updateMessageWithReceipt,
  updateMessageWithReaction,
  WAMessageKey,
  WAMessageCursor,
  WAMessage,
  makeWALegacySocket,
} from '@adiwajshing/baileys';
import { DataSource } from 'typeorm';
import { proto } from '@adiwajshing/baileys';
import {
  Chat as DBChat,
  Contact as DBContact,
  Message as DBMessage,
  MessageDic as DBMessageDic,
  PresenceDic as DBPresenceDic,
  GroupMetadata as DBGroupMetadata,
} from '../entities';

export class StoreHandler {
  private datasource: DataSource;
  private sessionId: string;
  state: ConnectionState = { connection: 'close' };

  constructor(datasource: DataSource, sessionId: string) {
    this.datasource = datasource;
    this.sessionId = sessionId;
  }

  chats = {
    all: async () => {
      try {
        return await this.datasource.getRepository(DBChat).findBy({
          instance: this.sessionId,
        });
      } catch (error) {
        return [];
      }
    },
    id: (chatId: string) => {
      try {
        return this.datasource.getRepository(DBChat).findOneBy({
          id: chatId,
          instance: this.sessionId,
        });
      } catch (error) {
        return null;
      }
    },
  };

  contacts = {
    all: () => {
      try {
        this.datasource.getRepository(DBContact).findBy({
          instance: this.sessionId,
        });
      } catch (error) {
        return [];
      }
    },
    jid: (jid: string) => {
      try {
        return this.datasource.getRepository(DBContact).findOneBy({
          jid,
          instance: this.sessionId,
        });
      } catch (error) {
        return null;
      }
    },
  };

  messages = {
    all: async (jid: string) => {
      try {
        const messages = await this.datasource
          .getRepository(DBMessageDic)
          .findOne({
            where: {
              jid,
              instance: this.sessionId,
            },
            relations: ['messages'],
          });
        return messages?.messages || [];
      } catch (error) {
        return [];
      }
    },
    id: async (jid: string, msgId: string) => {
      try {
        const messages = await this.datasource
          .getRepository(DBMessageDic)
          .findOne({
            where: {
              jid,
              instance: this.sessionId,
            },
            relations: ['messages'],
          });
        return messages?.messages?.find((x) => x.msgId === msgId) || null;
      } catch (error) {
        return null;
      }
    },
  };

  groupMetadata = {
    all: async () => {
      try {
        return await this.datasource.getRepository(DBGroupMetadata).findBy({
          instance: this.sessionId,
        });
      } catch (error) {
        return [];
      }
    },
    id: (groupId: string) => {
      try {
        return this.datasource.getRepository(DBGroupMetadata).findOneBy({
          id: groupId,
          instance: this.sessionId,
        });
      } catch (error) {
        return null;
      }
    },
  };

  presence = {
    all: async (jid: string) => {
      try {
        return (
          (await this.datasource.getRepository(DBPresenceDic).findBy({
            id: jid,
            instance: this.sessionId,
          })) || []
        );
      } catch (error) {
        return [];
      }
    },
    id: async (jid: string, participant: string) => {
      try {
        return (
          (
            await this.datasource.getRepository(DBPresenceDic).findOne({
              where: {
                id: jid,
                instance: this.sessionId,
              },
              relations: ['presences'],
            })
          )?.presences?.find((x) => x.participant === participant) || null
        );
      } catch (error) {
        return null;
      }
    },
  };

  loadMessages = async (
    jid: string,
    count: number,
    cursor: WAMessageCursor,
    sock: ReturnType<typeof makeWALegacySocket>,
  ) => {
    try {
      const dictionary = await this.datasource
        .getRepository(DBMessageDic)
        .findOne({
          where: {
            jid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
      if (!dictionary)
        return await this.datasource.getRepository(DBMessageDic).save({
          jid,
          instance: this.sessionId,
          messages: [],
        });

      const retrieve = async (count: number, cursor: WAMessageCursor) =>
        (await sock?.fetchMessagesFromWA(jid, count, cursor)) || [];

      const mode = !cursor || 'before' in cursor ? 'before' : 'after';
      const cursorKey = cursor
        ? 'before' in cursor
          ? cursor.before
          : cursor.after
        : undefined;
      const cursorValue = cursorKey
        ? dictionary.messages?.find((x) => x.msgId === cursorKey.id)
        : undefined;

      let messages: WAMessage[];
      if (dictionary && mode === 'before' && (!cursorKey || cursorValue)) {
        if (cursorValue) {
          const msgIdx = dictionary.messages?.findIndex(
            (m) => m.key?.id === cursorKey?.id,
          );
          messages = dictionary.messages?.slice(0, msgIdx) as WAMessage[];
        } else {
          messages = dictionary.messages as WAMessage[];
        }

        const diff = count - messages.length;
        if (diff < 0) {
          messages = messages.slice(-count);
        } else if (diff > 0) {
          const [fMessage] = messages;
          const cursor = { before: fMessage?.key || cursorKey };
          const extra = await retrieve(diff, cursor);

          for (let i = extra.length - 1; i >= 0; i--) {
            const message: DBMessage | undefined = dictionary.messages?.find(
              (x) => x.key?.id === extra[i].key.id,
            );
            if (message === undefined) {
              return await this.datasource.getRepository(DBMessage).save({
                ...(extra[i] as any),
                instance: this.sessionId,
                msgId: extra[i].key?.id,
                dictionary,
              });
            } else {
              Object.assign(message, extra[i]);
              await this.datasource
                .getRepository(DBMessageDic)
                .save(dictionary);
            }
          }

          messages.splice(0, 0, ...extra);
        }
      } else {
        messages = (await retrieve(count, cursor)) as any;
      }

      return messages;
    } catch (error) {
      return [];
    }
  };

  loadMessage = async (
    jid: string,
    id: string,
    sock: ReturnType<typeof makeWALegacySocket>,
  ) => {
    try {
      const dictionary = await this.datasource
        .getRepository(DBMessageDic)
        .findOne({
          where: {
            jid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
      if (!dictionary) {
        return await this.datasource.getRepository(DBMessageDic).save({
          jid,
          instance: this.sessionId,
          messages: [],
        });
      }
      const message = dictionary.messages?.find((x) => x.msgId === id);
      if (!message) {
        const msg = await sock.loadMessageFromWA(jid, id);
        if (msg) {
          return await this.datasource.getRepository(DBMessage).save({
            ...(msg as any),
            instance: this.sessionId,
            msgId: msg.key?.id,
            dictionary,
          });
        }
      }
      const savedMessage = await this.datasource
        .getRepository(DBMessage)
        .findOne({
          where: {
            msgId: id,
            instance: this.sessionId,
          },
        });
      if (savedMessage) {
        return savedMessage;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  mostRecentMessage = async (
    jid: string,
    sock: ReturnType<typeof makeWALegacySocket>,
  ) => {
    try {
      const dictionary = await this.datasource
        .getRepository(DBMessageDic)
        .findOne({
          where: {
            jid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
      if (!dictionary) {
        return await this.datasource.getRepository(DBMessageDic).save({
          jid,
          instance: this.sessionId,
          messages: [],
        });
      }
      const message = dictionary.messages?.slice(-1)[0];
      if (!message) {
        const items: proto.WebMessageInfo[] = await sock.fetchMessagesFromWA(
          jid,
          1,
          undefined,
        );
        if (items.length > 0) {
          const msg = items[0];
          return await this.datasource.getRepository(DBMessage).save({
            ...(msg as any),
            instance: this.sessionId,
            msgId: msg.key?.id,
            dictionary,
          });
        }
      }
      const savedMessage = await this.datasource
        .getRepository(DBMessage)
        .findOne({
          where: {
            msgId: message?.msgId,
            instance: this.sessionId,
          },
        });
      if (savedMessage) {
        return savedMessage;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  fetchImageUrl = async (
    jid: string,
    sock: ReturnType<typeof makeWASocket>,
    isThumbnail = false,
  ): Promise<string> => {
    try {
      if (!jid) {
        return '';
      }
      const contact = await this.datasource.getRepository(DBContact).findOneBy({
        id: jid,
        instance: this.sessionId,
      });
      if (contact?.imgUrl) {
        return contact.imgUrl;
      }
      const img = await sock.profilePictureUrl(
        jid,
        isThumbnail ? 'preview' : 'image',
      );
      if (img) {
        await this.datasource.getRepository(DBContact).update(
          {
            id: jid,
          },
          {
            imgUrl: img,
          },
        );
        return img;
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  fetchGroupMetadata = async (
    jid: string,
    sock: ReturnType<typeof makeWASocket>,
  ): Promise<DBGroupMetadata> => {
    try {
      const metadata = await this.datasource
        .getRepository(DBGroupMetadata)
        .findOneBy({
          id: jid,
          instance: this.sessionId,
        });
      !metadata &&
        (await this.datasource.getRepository(DBGroupMetadata).insert({
          instance: this.sessionId,
          ...(await sock.groupMetadata(jid)),
        }));
      return this.fetchGroupMetadata(jid, sock);
    } catch (error) {
      return {} as any;
    }
  };

  fetchBroadcastListInfo = async (
    jid: string,
    sock: ReturnType<typeof makeWALegacySocket>,
  ) => {
    try {
      const metadata = await this.datasource
        .getRepository(DBGroupMetadata)
        .findOneBy({
          instance: this.sessionId,
          id: jid,
        });
      !metadata &&
        (await this.datasource.getRepository(DBGroupMetadata).insert({
          ...(await sock.getBroadcastListInfo(jid)),
        }));
      return await this.fetchBroadcastListInfo(jid, sock);
    } catch (error) {
      return {} as any;
    }
  };

  fetchMessageReceipts = async (
    messageKey: WAMessageKey,
    sock: ReturnType<typeof makeWALegacySocket>,
  ) => {
    try {
      const { remoteJid, id } = messageKey;
      if (!remoteJid || !id) {
        return [];
      } else {
        const list = await this.datasource.getRepository(DBMessageDic).findOne({
          where: {
            jid: remoteJid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
        if (!list) {
          return [];
        }
        const msg = list.messages?.find((x) => x.msgId === id);
        if (!msg) {
          return [];
        }
        let receipts = msg.userReceipt;
        if (!receipts) {
          receipts = await sock.messageInfo(remoteJid, id);
          msg.instance = this.sessionId;
          msg.userReceipt = receipts;
          await this.datasource.getRepository(DBMessage).save(msg);
        }
        return receipts;
      }
    } catch (error) {
      return [];
    }
  };

  bind = (ev: BaileysEventEmitter) => {
    ev.on('connection.update', (update) => Object.assign(this.state, update));
    ev.on('chats.set', async ({ chats: newChats, isLatest }) => {
      isLatest &&
        (await this.datasource
          .getRepository(DBChat)
          .createQueryBuilder()
          .delete()
          .execute());
      await this.datasource.getRepository(DBChat).insert({
        instance: this.sessionId,
        ...newChats,
      });
    });
    ev.on('contacts.set', ({ contacts: newContacts }) =>
      this.datasource.getRepository(DBContact).upsert(
        {
          instance: this.sessionId,
          ...newContacts,
        },
        {
          conflictPaths: ['id'],
        },
      ),
    );
    ev.on('messages.set', async ({ messages: newMessages, isLatest }) => {
      if (isLatest) {
        const dictionary = await this.datasource
          .getRepository(DBMessageDic)
          .find({
            where: {
              instance: this.sessionId,
            },
            relations: ['messages'],
          });
        await Promise.all(
          dictionary.map(async (x) => {
            if (x.messages && x.messages.length > 0) {
              await this.datasource.getRepository(DBMessage).remove(x.messages);
            }
          }),
        );
      }
      newMessages as proto.WebMessageInfo[];
      if (newMessages.length > 0) {
        for (const msg of newMessages) {
          if (!msg.key) {
            continue;
          }
          const { remoteJid } = msg.key;
          if (!remoteJid) {
            continue;
          }
          const dictionary = await this.datasource
            .getRepository(DBMessageDic)
            .findOne({
              where: {
                jid: remoteJid,
                instance: this.sessionId,
              },
              relations: ['messages'],
            });
          if (!dictionary) {
            const { id } = msg.key;
            return await this.datasource.getRepository(DBMessageDic).save({
              jid: remoteJid,
              instance: this.sessionId,
              messages: [{ ...(msg as any), msgId: id }],
            });
          }

          let message: DBMessage | undefined = undefined;
          const { messages } = dictionary;
          if (messages && messages.length > 0) {
            message = messages.find((x) => x.key?.id === msg.key.id);
            if (!message) {
              return await this.datasource.getRepository(DBMessage).save({
                ...(msg as any),
                msgId: msg.key?.id,
                instance: this.sessionId,
                dictionary,
              });
            }
          }
          if (message) {
            Object.assign(message, msg);
            await this.datasource.getRepository(DBMessageDic).save(dictionary);
          }
        }
      }
    });

    ev.on('contacts.update', async (updates) => {
      for (const update of updates) {
        let contact: DBContact | null = await this.datasource
          .getRepository(DBContact)
          .findOneBy({
            jid: update.id,
            instance: this.sessionId,
          });
        if (!contact) {
          contact = await this.datasource.getRepository(DBContact).save({
            ...(update as any),
            instance: this.sessionId,
          });
        }
        if (!contact) return;
        Object.assign(contact, update);
        await this.datasource.getRepository(DBContact).save(contact);
      }
    });
    ev.on('chats.upsert', (newChats) => {
      this.datasource.getRepository(DBChat).upsert(
        {
          instance: this.sessionId,
          ...newChats,
        },
        {
          conflictPaths: ['id'],
        },
      );
    });
    ev.on('chats.update', async (updates) => {
      for (let update of updates) {
        const { id, unreadCount } = update;
        if (!id || !unreadCount) {
          continue;
        }
        const chat = await this.datasource.getRepository(DBChat).findOneBy({
          instance: this.sessionId,
          id: id,
        });
        if (!chat) return;
        if (unreadCount > 0) {
          update = { ...update };
          update.unreadCount = (chat.unreadCount || 0) + unreadCount;
        }
        Object.assign(chat, update);
        chat.instance = this.sessionId;
        await this.datasource.getRepository(DBChat).save(chat);
      }
    });
    ev.on('presence.update', async ({ id, presences: update }) => {
      const chat =
        (await this.datasource.getRepository(DBPresenceDic).findOne({
          where: {
            id,
            instance: this.sessionId,
          },
          relations: ['presences'],
        })) ||
        ({
          id,
          presences: [],
        } as unknown as DBPresenceDic);

      Object.entries(update).forEach(([id, presence]) => {
        const participant = chat.presences?.find((x) => x.participant === id);
        participant
          ? Object.assign(participant, presence)
          : chat.presences?.push({
              ...presence,
              participant: id,
            } as any);
      });
      await this.datasource.getRepository(DBPresenceDic).save(chat);
    });
    ev.on('chats.delete', async (deletions) => {
      for (const item of deletions) {
        await this.datasource.getRepository(DBChat).delete({
          id: item,
          instance: this.sessionId,
        });
      }
    });
    ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
      switch (type) {
        case 'append':
        case 'notify':
          for (const msg of newMessages) {
            if (!msg.key) {
              continue;
            }
            const { remoteJid } = msg.key;
            if (!remoteJid) {
              continue;
            }
            const dictionary = await this.datasource
              .getRepository(DBMessageDic)
              .findOne({
                where: {
                  jid: remoteJid,
                  instance: this.sessionId,
                },
                relations: ['messages'],
              });
            if (!dictionary)
              return await this.datasource.getRepository(DBMessageDic).save({
                jid: remoteJid,
                instance: this.sessionId,
                messages: [{ ...(msg as any), msgId: msg.key.id }],
              });
            const { messages } = dictionary;
            if (messages && messages.length > 0) {
              const message: DBMessage | undefined = messages.find(
                (x) => x.key?.id === msg.key.id,
              );
              if (!message) {
                return await this.datasource.getRepository(DBMessage).save({
                  ...(msg as any),
                  msgId: msg.key.id,
                  instance: this.sessionId,
                  dictionary,
                });
              }
              Object.assign(message, msg);
              await this.datasource
                .getRepository(DBMessageDic)
                .save(dictionary);
            }
            if (type === 'notify') {
              const chat = await this.datasource
                .getRepository(DBChat)
                .findOneBy({
                  id: remoteJid,
                  instance: this.sessionId,
                });
              if (!chat) {
                ev.emit('chats.upsert', [
                  {
                    id: remoteJid,
                    conversationTimestamp: toNumber(msg.messageTimestamp),
                    unreadCount: 1,
                  },
                ]);
              }
            }
          }
          break;
      }
    });
    ev.on('messages.update', async (updates) => {
      for (const { update, key } of updates) {
        if (!key) continue;
        const { remoteJid } = key;
        if (!remoteJid) continue;
        const dictionary = await this.datasource
          .getRepository(DBMessageDic)
          .findOne({
            where: {
              instance: this.sessionId,
              jid: remoteJid,
            },
            relations: ['messages'],
          });
        if (!dictionary)
          return await this.datasource.getRepository(DBMessageDic).save({
            jid: remoteJid,
            instance: this.sessionId,
            messages: [update as any],
          });

        const { messages } = dictionary;
        if (messages && messages.length > 0) {
          const message: DBMessage | undefined = messages.find(
            (x) => x.key?.id === key.id,
          );
          if (!message) {
            return await this.datasource.getRepository(DBMessage).save({
              ...(update as any),
              msgId: key.id,
              instance: this.sessionId,
              dictionary,
            });
          }
          Object.assign(message, update);
          await this.datasource.getRepository(DBMessageDic).save(dictionary);
        }
      }
    });
    ev.on('groups.update', async (updates) => {
      for (const update of updates) {
        const { id } = update;
        const group = await this.datasource
          .getRepository(DBGroupMetadata)
          .findOneBy({ id, instance: this.sessionId });
        if (!group) return;
        Object.assign(group, update);
        group.instance = this.sessionId;
        await this.datasource.getRepository(DBGroupMetadata).save(group);
      }
    });

    ev.on('group-participants.update', async ({ id, participants, action }) => {
      const metadata = await this.datasource
        .getRepository(DBGroupMetadata)
        .findOneBy({ id });
      if (!metadata) return;
      switch (action) {
        case 'add':
          metadata.participants = metadata.participants || [];
          metadata.participants.push(
            ...participants.map((id) => ({
              id,
              isAdmin: false,
              isSuperAdmin: false,
            })),
          );
          break;
        case 'demote':
        case 'promote':
          if (!metadata.participants) return;
          for (const participant of metadata.participants) {
            if (participants.includes(participant.id)) {
              participant.isAdmin = action === 'promote';
            }
          }
          break;
        case 'remove':
          if (!metadata.participants) return;
          metadata.participants = metadata.participants.filter(
            (p) => !participants.includes(p.id),
          );
          break;
      }
      metadata.instance = this.sessionId;
      await this.datasource.getRepository(DBGroupMetadata).save(metadata);
    });

    ev.on('message-receipt.update', async (updates) => {
      for (const { key, receipt } of updates) {
        const { remoteJid } = key;
        if (!remoteJid) continue;
        const obj = await this.datasource.getRepository(DBMessageDic).findOne({
          where: {
            jid: remoteJid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
        if (!obj) return;
        const { messages } = obj;
        if (!messages || messages.length === 0) return;
        const msg = messages.find((x) => {
          return x.key?.id === key.id;
        });
        if (msg) {
          updateMessageWithReceipt(msg, receipt);
          obj.instance = this.sessionId;
          await this.datasource.getRepository(DBMessageDic).save(obj);
        }
      }
    });

    ev.on('messages.reaction', async (reactions) => {
      for (const { key, reaction } of reactions) {
        const { remoteJid } = key;
        if (!remoteJid) continue;
        const obj = await this.datasource.getRepository(DBMessageDic).findOne({
          where: {
            jid: remoteJid,
            instance: this.sessionId,
          },
          relations: ['messages'],
        });
        if (!obj) return;
        const { messages } = obj;
        if (!messages || messages.length === 0) return;
        const msg = messages.find((x) => x.key?.id === key.id);
        if (msg) {
          updateMessageWithReaction(msg, reaction);
          obj.instance = this.sessionId;
          await this.datasource.getRepository(DBMessageDic).save(obj);
        }
      }
    });
  };
}
