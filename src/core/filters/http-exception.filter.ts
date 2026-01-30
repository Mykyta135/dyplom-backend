import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { sanitizeObject } from '../../common/utils/sanitizer.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const correlationId = request.correlationId ?? 'N/A';
    const method = request.method;
    const path = String(httpAdapter.getRequestUrl(request));
    const userAgent = request.get('user-agent') ?? 'unknown';
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorDetail: Record<string, unknown> | string;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      errorDetail =
        typeof res === 'object' ? (res as Record<string, unknown>) : res;
    } else if (exception instanceof Error) {
      errorDetail = {
        message: exception.message,
        name: exception.name,
      };
    } else {
      errorDetail = { message: 'An unexpected error occurred' };
    }

    const responseBody = {
      success: false,
      data: null,
      error:
        typeof errorDetail === 'string'
          ? { message: errorDetail }
          : errorDetail,
      meta: {
        timestamp: new Date().toISOString(),
        path,
        method,
        correlationId,
        statusCode: httpStatus,
      },
    };

    // FIX 3: Cast sanitizeObject result to unknown/Record to avoid 'any'
    const sanitizedError = sanitizeObject(errorDetail) as Record<
      string,
      unknown
    >;

    this.logger.error(
      {
        message: `[${correlationId}] ${method} ${path} - Status: ${String(httpStatus)}`,
        ip,
        userAgent,
        error: sanitizedError,
      },
      exception instanceof Error ? exception.stack : undefined,
    );

    if (httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      // FIX 4: Sanitize request.body safely
      const sanitizedBody = sanitizeObject(
        request.body as Record<string, unknown>,
      );
      this.logger.verbose(
        `[${correlationId}] Payload: ${JSON.stringify(sanitizedBody)}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
