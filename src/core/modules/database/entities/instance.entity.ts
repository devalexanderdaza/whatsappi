import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WhatsappiOptions } from '../../../interfaces';
import { InstanceConnectionStatus } from '../../../interfaces/instance.interface';

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

  @Column({ nullable: false, default: false })
  restartable!: boolean;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({ nullable: false, type: 'simple-json' })
  options!: WhatsappiOptions;

  @Column({
    nullable: false,
    type: 'enum',
    enum: InstanceConnectionStatus,
    default: InstanceConnectionStatus.DISCONNECTED,
  })
  connectionStatus!: InstanceConnectionStatus;
}
