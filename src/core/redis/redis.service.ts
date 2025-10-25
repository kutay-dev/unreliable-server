import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '@/core/logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(RedisService.name);
    this.redisClient = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: +this.configService.getOrThrow<string>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      tls:
        this.configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis client ready to use');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error', String(err));
    });

    this.redisClient.on('end', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  getClient() {
    return this.redisClient;
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    if (ttlSeconds)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.redisClient.set(key, value, 'EX', ttlSeconds);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.redisClient.set(key, value);
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async del(key: string) {
    return await this.redisClient.del(key);
  }

  async exists(key: string) {
    return await this.redisClient.exists(key);
  }

  async expire(key: string, ttlSeconds: number) {
    return await this.redisClient.expire(key, ttlSeconds);
  }

  async incr(key: string) {
    return await this.redisClient.incr(key);
  }
}
