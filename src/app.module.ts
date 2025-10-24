import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AwsModule } from './common/aws/aws.module';
import { LoggerModule } from './core/logger/logger.module';
import { RedisModule } from './core/redis/redis.module';
import { HealthModule } from './core/health/health.module';
import { EnvModule } from './core/env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    AwsModule,
    AuthModule,
    UserModule,
    ChatModule,
  ],
})
export class AppModule {}
