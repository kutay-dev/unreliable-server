import { AwsModule } from '@/core/aws/aws.module';
import { BullmqModule } from '@/core/bullmq/bullmq.module';
import { envConfig } from '@/core/env/env.config';
import { HealthModule } from '@/core/health/health.module';
import { LoggerModule } from '@/core/logger/logger.module';
import { RateLimitMiddleware } from '@/core/middleware/rate-limit.middleware';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { RedisModule } from '@/core/redis/redis.module';
import { AppConfigModule } from '@/modules/app-config/app-config.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { UserModule } from '@/modules/user/user.module';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
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
    AppConfigModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
