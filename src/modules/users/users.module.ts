import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepositoryPort } from './domain/ports/users.repository.port';
import { UsersController } from './infrastructure/api/controllers/users.controller';
import { UsersOrmEntity } from './infrastructure/persistence/entities/users.orm-entity';
import { UsersTypeOrmRepository } from './infrastructure/persistence/repositories/users-typeorm.repository';

const CommandHandlers = [];
const QueryHandlers = [];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UsersOrmEntity])],
  controllers: [UsersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    UsersTypeOrmRepository,
    {
      provide: UsersRepositoryPort,
      useExisting: UsersTypeOrmRepository,
    },
  ],
  exports: [UsersRepositoryPort, UsersTypeOrmRepository],
})
export class UsersModule {}
