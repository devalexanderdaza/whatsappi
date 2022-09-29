import { Column, Entity, OneToMany, PrimaryColumn, Unique } from 'typeorm';
import { Message } from './';

@Entity('message_dic')
@Unique(['id'])
export class MessageDic {
  @PrimaryColumn()
  id!: number;

  @Column({ nullable: false })
  instance!: string;

  @Column()
  jid!: string;

  @OneToMany(() => Message, (x) => x.dictionary, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  messages?: Message[];
}
