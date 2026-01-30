// File: backend/src/common/dto/response.dto.ts

export class PaginationMetaDto {
  readonly page: number;
  readonly take: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor(page: number, take: number, itemCount: number) {
    this.page = page;
    this.take = take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

/**
 * Used by services to return data + pagination info
 */
export class PaginatedResponseDto<T> {
  readonly data: T[];
  readonly meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}

export interface ResponseMeta {
  timestamp: string;
  path: string;
  version: string;
  pagination?: PaginationMetaDto;
}

/**
 * The final "Envelope" sent to the client
 */
export class ApiResponseDto<T> {
  readonly success: boolean;
  readonly data: T;
  readonly meta: ResponseMeta;

  constructor(data: T, path: string, pagination?: PaginationMetaDto) {
    this.success = true;
    this.data = data;
    this.meta = {
      timestamp: new Date().toISOString(),
      path,
      version: '1.0',
      ...(pagination && { pagination }),
    };
  }
}
