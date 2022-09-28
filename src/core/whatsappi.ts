import { WhatsappiOptions } from './interfaces';

export class Whatsappi {
  /**
   * Whatsappi options
   */
  private options: WhatsappiOptions;

  constructor(options: WhatsappiOptions) {
    this.options = options;
    console.log('Creating new Whatsappi instance', options);
  }
}
