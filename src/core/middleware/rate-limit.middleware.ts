import { LoggerService } from '@/core/logger/logger.service';
import { RedisService } from '@/core/redis/redis.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(RateLimitMiddleware.name);
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const limit = +this.configService.getOrThrow<string>('RATE_LIMIT');
    const ttl = +this.configService.getOrThrow<string>('RATE_LIMIT_TTL');

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || // proxy
      req.socket.remoteAddress || // direct connection
      'unknown';

    const key = `rate-limit:${ip}`;

    try {
      const count = await this.redisService.incr(key);

      if (count === 1) {
        await this.redisService.expire(key, ttl);
      }

      if (count > limit) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn('Rate limiter unavailable, allowing request', {
        ip,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next();
  }
}
