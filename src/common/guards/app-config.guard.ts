import { AppConfigService } from '@/modules/app-config/app-config.service';
import { AppConfigKey, CONFIG_ENABLED_KEY } from '@/modules/app-config/configs';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AppConfigGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly appConfig: AppConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<AppConfigKey>(
      CONFIG_ENABLED_KEY,
      ctx.getHandler(),
    );
    if (!feature) {
      return true;
    }
    const enabled = await this.appConfig.enabled(feature);
    if (!enabled) {
      throw new ServiceUnavailableException();
    }
    return true;
  }
}
