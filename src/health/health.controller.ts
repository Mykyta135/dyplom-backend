import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOkResponse({
    description: 'The application and its dependencies are healthy.',
  })
  @ApiServiceUnavailableResponse({
    description: 'A dependency (like the database) is unhealthy.',
  })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
