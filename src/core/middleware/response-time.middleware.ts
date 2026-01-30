import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Performance');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();

    res.on('finish', () => {
      const diff = process.hrtime(start);
      const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      res.setHeader('X-Response-Time', `${timeInMs}ms`);

      if (Number(timeInMs) > 1000) {
        this.logger.warn(
          `[SLOW DETECTED] ${req.method} ${req.originalUrl} took ${timeInMs}ms`,
        );
      }
    });

    next();
  }
}
