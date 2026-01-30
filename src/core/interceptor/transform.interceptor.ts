import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginationMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Response<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    path: string;
    pagination?: PaginationMeta;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: T | PaginatedData<T>) => {
        const isPaginated = this.isPaginated(data);

        return {
          success: true,
          data: isPaginated ? data.data : data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(isPaginated && { pagination: data.meta }),
          },
        } as Response<T>;
      }),
    );
  }

  private isPaginated(data: unknown): data is PaginatedData<unknown> {
    return (
      data !== null &&
      typeof data === 'object' &&
      'data' in data &&
      'meta' in data
    );
  }
}
