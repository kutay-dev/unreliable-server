import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['*'],
      allowedHeaders: ['*'],
    },
  });

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes any properties from the incoming payload that are not declared on the dto
      transform: true, // Converts plain json into your dto class instances and performs simple type coercion
    }),
  );

  setupSwagger(
    {
      title: 'Unreliable',
      version: '1.0.0',
    },
    app,
  );

  await app.listen(process.env.PORT || 3333);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
