import express from 'express';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '@/common/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '@/common/filters';
import { LoggerService } from '@/core/logger/logger.service';
import { ResponseInterceptor, LoggingInterceptor } from '@/core/interceptors';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    cors: {
      origin: '*',
      methods: ['*'],
      allowedHeaders: ['*'],
    },
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  app.enableCors();
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes any properties from the incoming payload that are not declared on the dto
      transform: true, // Converts plain json into your dto class instances and performs simple type coercion
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(logger),
  );

  if (configService.getOrThrow<string>('NODE_ENV') !== 'prod') {
    setupSwagger(
      {
        title: 'Unreliable',
        version: '1.0.0',
      },
      app,
    );
  }

  await app.listen(Number(configService.get<string>('PORT')) || 3333);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
