import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '@/core/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const limit = +this.configService.getOrThrow<string>('RATE_LIMIT');
    const ttl = +this.configService.getOrThrow<string>('RATE_LIMIT_TTL');

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || // proxy
      req.socket.remoteAddress || // direct connection
      'unknown';

    const key = `rate-limit:${ip}`;
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

    next();
  }
}
