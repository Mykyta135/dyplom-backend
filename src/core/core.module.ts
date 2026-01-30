import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from 'src/core/filters/http-exception.filter';
import { CircuitBreakerInterceptor } from './interceptor/circut-breaker.interceptor';
import { EtagInterceptor } from './interceptor/etag.interceptor';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { NullStripperInterceptor } from './interceptor/null-stripper.interceptor';
import { TimeoutInterceptor } from './interceptor/timeout.interceptor';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
  ],
  providers: [
    // --- FILTERS ---
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // --- GUARDS ---
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // --- INTERCEPTORS (Execution order: Top to Bottom) ---
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CircuitBreakerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NullStripperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EtagInterceptor,
    },
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
