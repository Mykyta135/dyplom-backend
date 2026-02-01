import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiExcludeController } from '@nestjs/swagger'; // Added this
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';
import type { AuditLogEvent } from './audit.interceptor';

@ApiExcludeController()
@Controller()
export class AuditWorker {
  private readonly logger = new Logger(AuditWorker.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  @EventPattern('audit_log')
  async handleAuditLog(@Payload() data: AuditLogEvent) {
    const MAX_RETRIES = 3;
    let attempt = 1;

    while (attempt <= MAX_RETRIES) {
      try {
        const log = this.repo.create({
          ...data,
          timestamp: new Date(data.timestamp),
        });
        await this.repo.save(log);
        this.logger.log(`[Worker] ✅ Saved audit log.`);
        return;
      } catch (e: unknown) {
        if (attempt === MAX_RETRIES) {
          const stack = e instanceof Error ? e.stack : undefined;

          this.logger.error(
            `[Worker] 💀 CRITICAL: Dropped audit log [${data.trackingId}] after ${String(MAX_RETRIES)} attempts. Payload: ${JSON.stringify(data)}`,
            stack,
          );
          return;
        } else {
          this.logger.warn(
            `[Worker] ⚠️ Save failed, retrying... (${String(attempt)}/${String(MAX_RETRIES)})`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          attempt++;
        }
      }
    }
  }
}
