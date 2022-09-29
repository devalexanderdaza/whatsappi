import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { WhatsappiOptions } from '../../../interfaces';

@Entity('instances')
export class Instance {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ nullable: false })
  sessionId!: string;

  @Column({ nullable: false })
  sessionName!: string;

  @Column({ nullable: false })
  sessionToken!: string;

  @Column({ nullable: true })
  webhookUrl?: string;

  @Column({ nullable: false })
  restartable!: boolean;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({ nullable: false, type: 'simple-json' })
  options!: WhatsappiOptions;

  @Column()
  connectionStatus!: string;
}
