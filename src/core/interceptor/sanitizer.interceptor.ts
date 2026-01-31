import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import DOMPurify from 'isomorphic-dompurify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Sanitizer');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();

    if (request.body) {
      request.body = this.clean(request.body) as Record<string, unknown>;
    }

    return next.handle().pipe(
      map((data) => {
        return this.clean(data);
      }),
    );
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  private clean(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.clean(item));
    }

    if (this.isPlainObject(obj)) {
      const sanitizedObj: Record<string, unknown> = {};
      const record = obj;

      for (const key of Object.keys(record)) {
        sanitizedObj[key] = this.clean(record[key]);
      }
      return sanitizedObj;
    }

    return obj;
  }
}
