import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  message?: string | string[];
  errors?: unknown[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const body = typeof exceptionResponse === 'object' && exceptionResponse !== null ? (exceptionResponse as ErrorResponseBody) : null;
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : body?.message ?? 'Error interno del servidor';

    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(status).json({
      success: false,
      message,
      errors: body?.errors ?? (Array.isArray(body?.message) ? body.message : []),
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
