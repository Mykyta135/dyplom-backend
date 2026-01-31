import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FORMAT_HTTP_HEADERS, Span, Tags, Tracer } from 'opentracing';
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

    const jaegerTracer = tracer as Tracer;
    const parentCtx = jaegerTracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const span: Span = jaegerTracer.startSpan(
      `${req.method} ${req.path}`,
      parentCtx ? { childOf: parentCtx } : undefined,
    );

    span.setTag(Tags.HTTP_METHOD, req.method);
    span.setTag(Tags.HTTP_URL, req.path);

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        const statusCode = res.statusCode;

        span.setTag(Tags.HTTP_STATUS_CODE, statusCode);
        span.finish();

        this.logger.log(
          `${req.method} ${req.path} ${String(statusCode)} +${String(delay)}ms`,
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
