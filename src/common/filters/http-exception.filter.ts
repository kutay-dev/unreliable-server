import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '@/common/types';
import { LoggerService } from '@/core/logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setModuleName(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const isHttp = exception instanceof HttpException;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode: string | undefined;

    if (isHttp) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') message = res;
      else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message || message;
        errorCode = body.errorCode;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `HTTP ${String(status)} ${req.method} ${req.url}   "${message}"`,
      isHttp ? undefined : (exception as Error)?.stack,
      { requestId: (req as any).requestId },
    );

    res.status(status).json({
      success: false,
      message,
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
    } as ErrorResponse);
  }
}
