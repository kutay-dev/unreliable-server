import { Environment } from '@/common/enums';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {
    this.nodeEnv = this.configService.getOrThrow<Environment>('NODE_ENV');
  }

  private moduleName?: string;
  private nodeEnv: Environment;

  setModuleName(moduleName: string): void {
    this.moduleName = moduleName;
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, {
      module: this.moduleName,
      env: this.nodeEnv,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, {
      module: this.moduleName,
      env: this.nodeEnv,
      ...meta,
    });
  }

  error(message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error(message, {
      trace,
      module: this.moduleName,
      env: this.nodeEnv,
      ...meta,
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, {
      module: this.moduleName,
      env: this.nodeEnv,
      ...meta,
    });
  }
}
