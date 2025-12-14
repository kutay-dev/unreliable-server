import { AppConfigKey, CONFIG_ENABLED_KEY } from '@/modules/app-config/configs';
import { SetMetadata } from '@nestjs/common';

export const ConfigEnabled = (key: AppConfigKey) =>
  SetMetadata(CONFIG_ENABLED_KEY, key);
