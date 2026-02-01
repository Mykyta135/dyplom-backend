import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = String(req.headers['x-tenant-id']);
    if (tenantId) {
      await this.dataSource.query(`SET app.current_tenant = '${tenantId}'`);
    }
    next();
  }
}
