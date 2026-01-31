import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { sanitizeObject } from '../../common/utils/sanitizer.util';

interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly httpAdapterHost?: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType();

    if (contextType === 'http') {
      this.handleHttpException(exception, host);
    } else {
      this.handleRpcException(exception, host);
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const adapter = this.httpAdapterHost?.httpAdapter;
    if (!adapter) {
      this.logger.error('HTTP Adapter not found in HTTP context.');
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelationId>();

    const correlationId = request.correlationId ?? 'N/A';
    const method = request.method;
    const path = String(adapter.getRequestUrl(request));
    const userAgent = request.get('user-agent') ?? 'unknown';
    const ip = request.ip;

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorDetail = this.extractErrorDetail(exception);

    const sanitizedError = sanitizeObject(errorDetail) as Record<
      string,
      unknown
    >;

    const responseBody = {
      success: false,
      data: null,
      error: sanitizedError,
      meta: {
        timestamp: new Date().toISOString(),
        path,
        method,
        correlationId,
        statusCode: httpStatus,
      },
    };

    this.logger.error(
      {
        message: `[${correlationId}] ${method} ${path} - Status: ${String(httpStatus)}`,
        ip,
        userAgent,
        error: sanitizedError,
      },
      exception instanceof Error ? exception.stack : undefined,
    );

    adapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private handleRpcException(exception: unknown, host: ArgumentsHost): void {
    const errorDetail = this.extractErrorDetail(exception);
    const sanitizedError = sanitizeObject(errorDetail) as Record<
      string,
      unknown
    >;

    const rpcData = host.switchToRpc().getData<unknown>();

    this.logger.error(
      {
        message: `[WORKER ERROR] Microservice task failed`,
        error: sanitizedError,
        payload: sanitizeObject(rpcData),
      },
      exception instanceof Error ? exception.stack : undefined,
    );
  }

  // Changed return type from 'any' to 'Record<string, unknown>'
  private extractErrorDetail(exception: unknown): Record<string, unknown> {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      return typeof res === 'object'
        ? (res as Record<string, unknown>)
        : { message: res };
    } else if (exception instanceof Error) {
      return { message: exception.message, name: exception.name };
    }
    return { message: 'An unexpected error occurred' };
  }
}
