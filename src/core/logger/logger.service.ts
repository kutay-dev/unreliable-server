import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  private moduleName?: string;

  setModuleName(moduleName: string) {
    this.moduleName = moduleName;
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { module: this.moduleName, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, { module: this.moduleName, ...meta });
  }

  error(message: string, trace?: string, meta?: Record<string, unknown>) {
    this.logger.error(message, { trace, module: this.moduleName, ...meta });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, { module: this.moduleName, ...meta });
  }
}
