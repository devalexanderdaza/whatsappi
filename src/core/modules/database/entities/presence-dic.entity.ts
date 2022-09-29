import { Column, Entity, OneToMany, PrimaryColumn, Unique } from 'typeorm';
import { Presence } from './';

@Entity('presence_dic')
@Unique(['DBId'])
export class PresenceDic {
  @PrimaryColumn()
  DBId!: number;

  @Column()
  id!: string;

  @Column({ nullable: false })
  instance!: string;

  @OneToMany(() => Presence, (x) => x.dictionary, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  presences?: Presence[];
}
