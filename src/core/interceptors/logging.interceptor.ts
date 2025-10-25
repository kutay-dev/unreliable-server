// src/core/interceptors/logging.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '@/core/logger/logger.service';

function shouldLogPath(path?: string) {
  if (!path) return true;
  // reduce noise
  if (path.startsWith('/health')) return false;
  if (path.startsWith('/docs')) return false;
  return true;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setModuleName(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle(); // only log HTTP here
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method = req.method as string;
    const originalUrl = req.originalUrl as string;
    const start = Date.now();

    const requestId = req.requestId as string | undefined;
    const userId = req.user?.id as string | undefined;

    if (shouldLogPath(originalUrl)) {
      this.logger.log(`Request: [${method}] ${originalUrl}`, {
        requestId,
        userId,
        method,
        url: originalUrl,
        body: req.body,
        query: req.query,
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          if (!shouldLogPath(originalUrl)) return;
          const durationMs = Date.now() - start;
          const statusCode = res.statusCode as number;
          const contentLength = res.get?.('content-length');
          const userAgent = req.headers?.['user-agent'];
          this.logger.log(
            `Response: [${method}] ${originalUrl} -> ${String(statusCode)} in ${String(durationMs)}ms`,
            {
              requestId,
              userId,
              method,
              url: originalUrl,
              statusCode,
              durationMs,
              contentLength,
              userAgent,
            },
          );
        },
        error: (err: any) => {
          if (!shouldLogPath(originalUrl)) return;
          const durationMs = Date.now() - start;
          const statusCode = (err?.status as number) ?? 500;
          this.logger.error(
            `Response: [${method}] ${originalUrl} failed -> ${String(statusCode)} in ${String(durationMs)}ms`,
            err?.stack,
            {
              requestId,
              userId,
              method,
              url: originalUrl,
              statusCode,
              durationMs,
            },
          );
        },
      }),
    );
  }
}
