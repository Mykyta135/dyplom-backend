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
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { sanitizeObject } from '../../common/utils/sanitizer.util';

interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly httpAdapterHost?: HttpAdapterHost) {}

  /**
   * We use 'Observable<unknown> | undefined' to satisfy linters that
   * forbid 'any' and forbid 'void' in unions.
   */
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): Observable<unknown> | undefined {
    const contextType = host.getType();

    if (contextType === 'http') {
      this.handleHttpException(exception, host);
      return undefined; // Explicitly return undefined instead of void
    }

    if (contextType === 'rpc') {
      return this.handleRpcException(exception, host);
    }

    this.logger.error(`Unhandled context type: ${contextType}`);
    return undefined;
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const adapter = this.httpAdapterHost?.httpAdapter;
    if (!adapter) {
      this.logger.error('HTTP Adapter not found in HTTP context.');
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelationId>();
    const response = ctx.getResponse<Response>();

    const correlationId = request.correlationId ?? 'N/A';
    const method = request.method;
    const path = String(adapter.getRequestUrl(request));
    const userAgent = request.get('user-agent') ?? 'unknown';
    const ip = request.ip ?? 'unknown';

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

    adapter.reply(response, responseBody, httpStatus);
  }

  private handleRpcException(
    exception: unknown,
    host: ArgumentsHost,
  ): Observable<unknown> {
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

    return throwError(() => new RpcException(sanitizedError));
  }

  private extractErrorDetail(exception: unknown): Record<string, unknown> {
    if (exception instanceof HttpException) {
      const res: unknown = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        return res as Record<string, unknown>;
      }
      return { message: String(res) };
    }

    if (exception instanceof RpcException) {
      const rpcError: unknown = exception.getError();
      if (typeof rpcError === 'object' && rpcError !== null) {
        return rpcError as Record<string, unknown>;
      }
      return { message: String(rpcError) };
    }

    if (exception instanceof Error) {
      return { message: exception.message, name: exception.name };
    }

    return { message: 'An unexpected error occurred' };
  }
}
