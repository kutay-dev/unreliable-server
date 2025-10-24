import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '@/common/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['*'],
      allowedHeaders: ['*'],
    },
  });

  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes any properties from the incoming payload that are not declared on the dto
      transform: true, // Converts plain json into your dto class instances and performs simple type coercion
    }),
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
