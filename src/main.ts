import { Environment } from '@/common/enums';
import { HttpExceptionFilter } from '@/common/filters';
import { setupSwagger } from '@/common/swagger';
import { LoggingInterceptor, ResponseInterceptor } from '@/core/interceptors';
import { LoggerService } from '@/core/logger/logger.service';
import { enableGracefulTermination } from '@/core/termination';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    cors: {
      origin: '*',
      methods: ['*'],
      allowedHeaders: ['*'],
    },
  });

  const configService = app.get(ConfigService);
  const logger = await app.resolve(LoggerService);

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
    new ResponseInterceptor(configService),
    new LoggingInterceptor(logger),
  );

  if (configService.getOrThrow<Environment>('NODE_ENV') !== Environment.PROD) {
    setupSwagger(
      {
        title: 'Unreliable',
        version: '1.0.0',
      },
      app,
    );
  }

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  enableGracefulTermination(app);
  const PORT = Number(configService.get<string>('PORT'));
  await app.listen(PORT, '0.0.0.0');
  logger.log(`Server is running on PORT: ${PORT}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
