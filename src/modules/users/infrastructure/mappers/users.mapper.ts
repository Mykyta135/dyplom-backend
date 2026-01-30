import { Users } from '../../domain/entities/users.entity';
import { UsersOrmEntity } from '../persistence/entities/users.orm-entity';

export class UsersMapper {
  static toDomain(orm: UsersOrmEntity): Users {
    return new Users(orm.id);
  }

  static toPersistence(domain: Users): UsersOrmEntity {
    const orm = new UsersOrmEntity();
    orm.id = domain.id;
    return orm;
  }
}
