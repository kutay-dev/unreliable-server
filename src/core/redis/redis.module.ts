import { Global, Module } from '@nestjs/common';
import { ChatCacheService } from './cache/chat-cache.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService, ChatCacheService],
  exports: [RedisService, ChatCacheService],
})
export class RedisModule {}
