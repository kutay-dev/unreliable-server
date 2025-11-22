import { Injectable } from '@nestjs/common';
import { Message } from 'generated/prisma/client';
import { Redis } from 'ioredis';
import { RedisService } from '../redis.service';

@Injectable()
export class ChatCacheService {
  private redisClient: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getClient();
  }

  async addMessage(chatId: string, message: Message): Promise<void> {
    const key = `chat:${chatId}:messages:last50`;
    await this.redisClient
      .multi()
      .rpush(key, JSON.stringify(message))
      .ltrim(key, -50, -1)
      .expire(key, 60 * 60 * 24)
      .exec();
  }

  async getLast50Messages(chatId: string): Promise<Message[]> {
    const key = `chat:${chatId}:messages:last50`;
    const messages = (await this.redisClient.lrange(key, -50, -1)) ?? [];
    return messages.map((m) => JSON.parse(m) as Message);
  }
}
