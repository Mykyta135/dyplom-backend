import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId =
      req.header('x-request-id') ?? req.header('x-correlation-id');
    const id = existingId ?? uuidv4();

    req.correlationId = id;

    req.headers['x-correlation-id'] = id;

    res.setHeader('X-Correlation-ID', id);

    next();
  }
}
