import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '@/core/logger/logger.service';
import { Message } from '@prisma/client';

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

  async addMessage(roomId: string, message: Message) {
    const key = `room:${roomId}:last50`;
    await this.redisClient.rpush(key, JSON.stringify(message));
    await this.redisClient.ltrim(key, -50, -1);
    await this.redisClient.expire(key, 60 * 60 * 24);
  }

  async getLast50Messages(roomId: string): Promise<Message[]> {
    const key = `room:${roomId}:last50`;
    const messages = (await this.redisClient.lrange(key, -50, -1)) ?? [];
    return messages.map((m) => JSON.parse(m) as Message);
  }
}
