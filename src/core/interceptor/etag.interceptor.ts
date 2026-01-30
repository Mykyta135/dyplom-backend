import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class EtagInterceptor<T> implements NestInterceptor<T, T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        const etag = crypto
          .createHash('md5')
          .update(JSON.stringify(data))
          .digest('hex');

        res.setHeader('ETag', etag);
        return data;
      }),
    );
  }
}
