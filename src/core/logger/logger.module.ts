import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { ElasticModule } from '../elastic/elastic.module';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    ElasticModule,
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf(
              ({ timestamp, level, message }) =>
                `${String(timestamp)} [${String(level)}]: ${String(message)}`,
            ),
          ),
        }),
        new transports.File({
          filename: 'logs/app.json',
          format: format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            format.json(),
          ),
        }),
      ],
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
