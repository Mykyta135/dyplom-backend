import { Controller, Get, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'; // New imports
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { redisConfig } from 'src/config/database.config';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    @Inject(redisConfig.KEY)
    private redisCfg: ConfigType<typeof redisConfig>,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API and infrastructure status' })
  @ApiOkResponse({ description: 'The health check has passed' }) // FIX: Linter error 22:3
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: this.redisCfg.host,
            port: this.redisCfg.port,
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
    ]);
  }
}
