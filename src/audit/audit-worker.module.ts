// src/audit/audit-worker.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { AuditWorker } from './audit.worker';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditWorker], // Static reference satisfies ESLint
})
export class AuditWorkerModule {}
