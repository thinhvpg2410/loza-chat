import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CORRELATION_HEADER } from '../common/correlation/correlation-id.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const correlationId =
      request?.correlationId ??
      request?.header(CORRELATION_HEADER) ??
      'unknown';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : this.normalizeMessage(
              (body as { message?: string | string[] }).message,
            );
      response.status(status).json({
        error: {
          code: status,
          message,
          correlationId,
        },
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        correlationId,
      },
    });
  }

  private normalizeMessage(message: string | string[] | undefined): string {
    if (Array.isArray(message)) {
      return message[0] ?? 'Request failed';
    }
    return message ?? 'Request failed';
  }
}
