import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRepositoryPort } from '../../../domain/ports/users.repository.port';
import { UsersOrmEntity } from '../entities/users.entity';

@Injectable()
export class UsersTypeOrmRepository implements UsersRepositoryPort {
  constructor(
    @InjectRepository(UsersOrmEntity)
    private readonly ormRepo: Repository<UsersOrmEntity>,
  ) {}
}
