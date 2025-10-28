import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AwsModule } from '@/core/aws/aws.module';
import { LoggerModule } from '@/core/logger/logger.module';
import { RedisModule } from '@/core/redis/redis.module';
import { HealthModule } from '@/core/health/health.module';
import { EnvModule } from '@/core/env';
import { RateLimitMiddleware } from '@/core/middleware/rate-limit.middleware';
import { BullmqModule } from '@/core/bullmq/bullmq.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    BullmqModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        connection: {
          host: cs.getOrThrow<string>('REDIS_HOST'),
          port: +cs.getOrThrow<string>('REDIS_PORT'),
          password: cs.get<string>('REDIS_PASSWORD'),
          tls: cs.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
    }),
    HealthModule,
    AwsModule,
    AuthModule,
    UserModule,
    ChatModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
