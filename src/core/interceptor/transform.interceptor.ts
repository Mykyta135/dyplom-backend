import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../common/dto/response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    if (context.getType() !== 'http') {
      return next.handle() as unknown as Observable<ApiResponseDto<T>>;
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (this.isPaginatedResponse(result)) {
          return new ApiResponseDto<T>(
            result.data as T,
            request.url,
            result.meta,
          );
        }

        return new ApiResponseDto<T>(result as T, request.url);
      }),
    );
  }

  private isPaginatedResponse(
    result: unknown,
  ): result is PaginatedResponseDto<unknown> {
    if (typeof result !== 'object' || result === null) {
      return false;
    }

    const candidate = result as Record<string, unknown>;

    if (!('data' in candidate) || !Array.isArray(candidate.data)) {
      return false;
    }

    const meta = candidate.meta as Record<string, unknown> | undefined;
    return (
      typeof meta === 'object' &&
      'page' in meta &&
      'take' in meta &&
      'itemCount' in meta
    );
  }
}
