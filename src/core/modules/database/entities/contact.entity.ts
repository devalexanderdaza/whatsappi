import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('contacts')
@Unique(['DBId', 'id'])
export class Contact {
  @PrimaryColumn()
  DBId!: number;

  @Column({ nullable: false })
  instance!: string;

  @Column({ unique: true })
  id!: string;

  @Column({ nullable: false })
  jid!: string;

  @Column({ nullable: false })
  countryCode!: string;

  @Column({ nullable: false })
  phoneNumber!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  notify?: string;

  @Column({ nullable: true })
  verifiedName?: string;

  @Column({ nullable: true })
  imgUrl?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: false, default: false })
  isBusiness?: boolean;
}
