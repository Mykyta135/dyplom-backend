import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class EtagInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(EtagInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    if (context.getType() !== 'http') return next.handle();

    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        if (!data || typeof data !== 'object') {
          return data;
        }

        try {
          const etag = crypto
            .createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');

          res.setHeader('ETag', etag);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Could not generate ETag for response: ${message}`);
        }
        return data;
      }),
    );
  }
}
