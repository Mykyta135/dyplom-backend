import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private failureCount = 0;
  private readonly threshold = 5;
  private lastFailureTime = 0;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (
      this.failureCount >= this.threshold &&
      Date.now() - this.lastFailureTime < 30000
    ) {
      throw new ServiceUnavailableException(
        'System is in recovery. Please try again later.',
      );
    }

    return next.handle().pipe(
      tap({
        error: () => {
          this.failureCount++;
          this.lastFailureTime = Date.now();
        },
        next: () => {
          this.failureCount = 0;
        },
      }),
    );
  }
}
