import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ChatCacheService } from './cache/chat-cache.service';

@Global()
@Module({
  providers: [RedisService, ChatCacheService],
  exports: [ChatCacheService],
})
export class RedisModule {}
