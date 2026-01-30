import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/core/redis/redis.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, TypeOrmModule.forFeature([]), RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
