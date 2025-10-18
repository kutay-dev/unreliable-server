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
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
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
}
