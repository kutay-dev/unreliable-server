import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationOptions: {
        allowUnknown: false,
        abortEarly: false,
      },
    }),
  ],
})
export class EnvModule {}
