import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Request } from 'express';
import { AllExceptionsFilter } from 'src/core/filters/http-exception.filter';
// import { InfrastructureTestController } from './controllers/infrastructure-test.controller';
import { UnitOfWork } from './database/unit-of-work';
import { CircuitBreakerInterceptor } from './interceptor/circut-breaker.interceptor';
import { EtagInterceptor } from './interceptor/etag.interceptor';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { NullStripperInterceptor } from './interceptor/null-stripper.interceptor';
import { SanitizerInterceptor } from './interceptor/sanitizer.interceptor';
import { TimeoutInterceptor } from './interceptor/timeout.interceptor';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  providers: [UnitOfWork, AllExceptionsFilter],
  exports: [UnitOfWork, AllExceptionsFilter], // Added export for safety
})
export class CoreModule {}

/**
 * Separate Module for Infrastructure Tests
 * This solves the "Controller not referenced" error by giving it
 * its own dedicated, non-conditional module container.
 */
@Module({
  controllers: [],
})
export class DevTestModule {}

@Module({
  imports: [
    DevTestModule, // Import the test module here
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 15,
        skipIf: (context): boolean => {
          if (context.getType() !== 'http') return true;
          const req = context.switchToHttp().getRequest<Request>();
          return req.method === 'GET' && req.url.includes('/metrics');
        },
      },
    ]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: SanitizerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CircuitBreakerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: NullStripperInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: EtagInterceptor },
  ],
})
export class HttpCoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
