import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { Observable } from 'rxjs';

interface AuditLogEvent {
  trackingId: string;
  action: string;
  ip: string;
  payload: unknown;
  timestamp: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditProducer');

  constructor(@Inject('AUDIT_SERVICE') private readonly client: ClientProxy) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const trackingId = (req.headers['x-correlation-id'] ??
        'unknown') as string;
      const ipAddress = req.ip ?? req.socket.remoteAddress ?? 'unknown';

      const event: AuditLogEvent = {
        trackingId: trackingId,
        action: `${method} ${req.url}`,
        ip: ipAddress,
        payload: req.body as unknown,
        timestamp: new Date().toISOString(),
      };

      this.client.emit('audit_log', event);
      this.logger.verbose(`[${trackingId}] -> Sent to Audit Queue`);
    }

    return next.handle();
  }
}
