import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class NullStripperInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.removeNulls(data)));
  }

  private removeNulls(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.removeNulls(v));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => [k, this.removeNulls(v)]),
      );
    }
    return obj;
  }
}
