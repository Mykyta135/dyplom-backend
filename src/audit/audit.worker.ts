import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';

interface AuditEventPayload {
  trackingId: string;
  action: string;
  ip: string;
  payload: unknown;
}

@ApiTags('Audit Worker')
@Controller()
export class AuditWorker {
  private readonly logger = new Logger(AuditWorker.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  @EventPattern('audit_log')
  async handleAuditLog(@Payload() data: AuditEventPayload) {
    this.logger.log(`[Worker] 📨 Received Audit Event: ${data.trackingId}`);

    try {
      const log = this.repo.create({
        trackingId: data.trackingId,
        action: data.action,
        ip: data.ip,
        payload: data.payload,
      });
      await this.repo.save(log);
      this.logger.log(`[Worker] ✅ Saved audit log to DB.`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(
        `[Worker] ❌ Failed to save audit log: ${errorMessage}`,
      );
    }
  }
}
