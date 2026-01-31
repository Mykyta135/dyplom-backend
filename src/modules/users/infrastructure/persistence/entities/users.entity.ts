import { Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UsersOrmEntity {
  @PrimaryColumn('uuid')
  id: string;
}
