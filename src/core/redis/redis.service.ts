import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '@/core/logger/logger.service';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor(private readonly logger: LoggerService) {
    this.logger.setModuleName(RedisService.name);
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT!,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
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
