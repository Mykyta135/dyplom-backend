import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class MetricsExemptThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger('ThrottlerGuard');

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async shouldSkipConnectors(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const path = request.url;
    const ip = request.ip ?? 'unknown';

    const isPrometheus = userAgent.includes('Prometheus');
    const isMetricsPath = path.includes('metrics');

    const shouldSkip: boolean = isPrometheus || isMetricsPath;

    if (shouldSkip) {
      this.logger.verbose(
        `[WHITELISTED] Path: ${path} | UA: ${userAgent} | IP: ${ip} | Result: SKIP THROTTLING ✅`,
      );
    } else {
      this.logger.debug(
        `[ENFORCING] Path: ${path} | IP: ${ip} | Result: APPLY LIMITS 🛡️`,
      );
    }

    return shouldSkip;
  }
}
