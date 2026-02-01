import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Span, Tags, Tracer } from 'opentracing'; // Added Tracer here
import { catchError, Observable, tap } from 'rxjs';
import { tracer } from '../../tracing';

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // FIX: Cast tracer explicitly to the 'Tracer' type locally
    // This tells ESLint: "I promise this is a Tracer object with a startSpan method"
    const jaegerTracer = tracer as Tracer;
    const span: Span = jaegerTracer.startSpan(`${req.method} ${req.path}`);

    span.setTag(Tags.HTTP_METHOD, req.method);
    span.setTag(Tags.HTTP_URL, req.url);
    span.setTag('ip', req.ip ?? 'unknown');

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        const statusCode = res.statusCode;

        span.setTag(Tags.HTTP_STATUS_CODE, statusCode);
        span.finish();

        this.logger.log(
          `${req.method} ${req.url} ${String(statusCode)} +${String(delay)}ms`,
        );
      }),
      catchError((err: Error) => {
        span.setTag(Tags.ERROR, true);
        span.log({
          event: 'error',
          message: err.message,
          stack: err.stack ?? 'no-stack',
        });
        span.finish();
        throw err;
      }),
    );
  }
}
