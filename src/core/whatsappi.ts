import { WhatsappiOptions } from './interfaces';
import DatabaseModule from './modules/database/index';
import { AuthHandler } from './modules/database/handlers/auth.handler';
import { StoreHandler } from './modules/database/handlers/store.handler';
import { AuthenticationState } from '@adiwajshing/baileys';

export class Whatsappi {
  /**
   * Whatsappi options
   */
  private options: WhatsappiOptions;
  private auth: AuthHandler;
  private store: StoreHandler;

  constructor(options: WhatsappiOptions) {
    this.options = options;
    console.log('Creating new Whatsappi instance', options);
    this.init().then(({ auth, store }) => {
      this.auth = auth;
      this.store = store;
    });
  }

  private init = async (): Promise<{
    auth: AuthHandler;
    store: StoreHandler;
  }> => {
    const { auth, store } = await DatabaseModule(
      this.options,
      {
        type: 'sqlite',
        database: 'whatsappi.db',
      },
      {
        debug: true,
        sync: false,
      },
    );
    return { auth, store };
  };

  private getState = async (): Promise<{
    state: AuthenticationState;
    saveState: () => void;
  }> => {
    const { state, saveState } = await this.auth.useAuthHandle();
    return { state, saveState };
  };

  private getStore = async (): Promise<StoreHandler> => {
    return this.store;
  };

  public start = async (): Promise<void> => {
    const { state, saveState } = await this.getState();
    const store = await this.getStore();
    console.log('State', state);
    console.log('Store', store);
  };
}
