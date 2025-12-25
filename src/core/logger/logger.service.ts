import { Environment } from '@/common/enums';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.nodeEnv = this.configService.getOrThrow<Environment>('NODE_ENV');
  }

  private moduleName?: string;
  private nodeEnv: Environment;

  setModuleName(moduleName: string): void {
    this.moduleName = moduleName;
  }

  private logData = (meta?: Record<string, unknown>) => {
    return { module: this.moduleName, env: this.nodeEnv, ...meta };
  };

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, this.logData(meta));
    this.indexToElastic('info', message, this.logData(meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, this.logData(meta));
    this.indexToElastic('warn', message, this.logData(meta));
  }

  error(message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error(message, {
      trace,
      ...this.logData(meta),
    });
    this.indexToElastic('error', message, this.logData(meta), trace);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, this.logData(meta));
  }

  private indexToElastic(
    level: string,
    message: string,
    meta?: Record<string, unknown>,
    trace?: string,
  ) {
    try {
      void this.elasticsearchService.index({
        index: 'app-logs',
        document: {
          timestamp: new Date().toISOString(),
          level,
          message,
          meta,
          trace,
        },
      });
    } catch (e) {
      this.logger.error('Elastic logging failed', { trace: e });
    }
  }
}
