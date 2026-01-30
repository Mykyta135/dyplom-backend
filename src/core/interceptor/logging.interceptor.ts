import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithCorrelationId } from '../middleware/correlation-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelationId>();
    const { method, url, correlationId } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        const statusCode = String(response.statusCode);
        const delay = String(Date.now() - now);
        const safeCorrelationId = correlationId ?? 'N/A';

        this.logger.log(
          `[${safeCorrelationId}] ${method} ${url} ${statusCode} +${delay}ms`,
        );
      }),
    );
  }
}
