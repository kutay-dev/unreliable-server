import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { RedisService } from '../redis.service';
import { Redis } from 'ioredis';

@Injectable()
export class ChatCacheService {
  private redisClient: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getClient();
  }

  async addMessage(chatId: string, message: Message) {
    const key = `chat:${chatId}:messages:last50`;
    await this.redisClient.rpush(key, JSON.stringify(message));
    await this.redisClient.ltrim(key, -50, -1);
    if (await this.redisClient.exists(key)) {
      await this.redisClient.expire(key, 60 * 60 * 24);
    }
  }

  async getLast50Messages(chatId: string): Promise<Message[]> {
    const key = `chat:${chatId}:messages:last50`;
    const messages = (await this.redisClient.lrange(key, -50, -1)) ?? [];
    return messages.map((m) => JSON.parse(m) as Message);
  }
}
