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

    if (request.body && typeof request.body === 'object') {
      request.body = this.clean(request.body);
    }

    return next.handle().pipe(
      map((data) => {
        return this.clean(data);
      }),
    );
  }

  private clean(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // If it's a string, sanitize it
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }

    // If it's an array, clean every item
    if (Array.isArray(obj)) {
      return obj.map((item) => this.clean(item));
    }

    // If it's an object, clean every property
    if (typeof obj === 'object') {
      const sanitizedObj: Record<string, unknown> = {};
      const record = obj as Record<string, unknown>;

      for (const key of Object.keys(record)) {
        sanitizedObj[key] = this.clean(record[key]);
      }
      return sanitizedObj;
    }

    return obj;
  }
}
