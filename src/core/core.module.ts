import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from 'src/core/filters/http-exception.filter';
import { InfrastructureTestController } from './controllers/infrastructure-test.controller';
import { UnitOfWork } from './database/unit-of-work';
import { MetricsExemptThrottlerGuard } from './guards/throttler-behind-proxy.guard';
import { CircuitBreakerInterceptor } from './interceptor/circut-breaker.interceptor';
import { EtagInterceptor } from './interceptor/etag.interceptor';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { NullStripperInterceptor } from './interceptor/null-stripper.interceptor';
import { SanitizerInterceptor } from './interceptor/sanitizer.interceptor';
import { TimeoutInterceptor } from './interceptor/timeout.interceptor';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15,
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
    MetricsExemptThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: MetricsExemptThrottlerGuard,
    },
    // --- INTERCEPTORS --
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizerInterceptor,
    },
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
    UnitOfWork,
  ],
  exports: [UnitOfWork],
  controllers: [InfrastructureTestController],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
