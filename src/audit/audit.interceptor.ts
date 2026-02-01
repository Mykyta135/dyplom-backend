import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { pick } from 'lodash';
import { Observable } from 'rxjs';
import { AUDIT_METADATA_KEY } from './audit.decorator';

export interface AuditLogEvent {
  trackingId: string;
  action: string;
  ip: string;
  payload: unknown;
  timestamp: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditProducer');

  constructor(
    @Inject('AUDIT_SERVICE') private readonly client: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const fieldsToLog = this.reflector.get<string[] | undefined>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!fieldsToLog) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const trackingId = (req.headers['x-correlation-id'] ??
        'unknown') as string;
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? 'unknown';

      const payload = pick(req.body, fieldsToLog);
      const event: AuditLogEvent = {
        trackingId: trackingId,
        action: `${req.method} ${req.path}`,
        ip: ipAddress,
        payload: payload,
        timestamp: new Date().toISOString(),
      };

      this.client.emit('audit_log', event).subscribe({
        error: (err: unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : JSON.stringify(err);
          this.logger.warn(
            `[${trackingId}] Failed to emit audit event: ${errorMessage}`,
          );
        },
      });
      this.logger.verbose(`[${trackingId}] -> Sent to Audit Queue`);
    }

    return next.handle();
  }
}
