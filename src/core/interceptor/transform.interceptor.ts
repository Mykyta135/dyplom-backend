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
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (result instanceof PaginatedResponseDto) {
          return new ApiResponseDto(result.data as T, request.url, result.meta);
        }

        return new ApiResponseDto(result as T, request.url);
      }),
    );
  }
}
