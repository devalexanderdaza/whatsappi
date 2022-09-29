import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('auth')
@Unique(['id'])
export class Auth {
  @PrimaryColumn()
  id!: number;

  @Column({ nullable: false })
  sessionId!: string;

  @Column()
  key!: string;

  @Column()
  value!: string;
}
