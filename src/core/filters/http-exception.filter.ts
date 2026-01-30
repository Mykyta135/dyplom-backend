import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { sanitizeObject } from '../../common/utils/sanitizer.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Record<string, unknown>>();

    const correlationId = request.correlationId ?? 'N/A';

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let exceptionResponse: unknown;

    if (exception instanceof HttpException) {
      exceptionResponse = exception.getResponse();
    } else if (exception instanceof Error) {
      exceptionResponse = {
        message: exception.message,
        stack: exception.stack,
      };
    } else {
      exceptionResponse = { message: 'Internal server error' };
    }

    const path = String(httpAdapter.getRequestUrl(request));

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: path,
      correlationId: correlationId,
    };

    const sanitizedLog = sanitizeObject(exceptionResponse);

    this.logger.error({
      message: `Request failed at ${path}`,
      status: httpStatus,
      correlationId: correlationId,
      error: sanitizedLog,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
