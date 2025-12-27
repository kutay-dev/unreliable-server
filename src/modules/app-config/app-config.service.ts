import { normalizeString } from '@/common/utils/common.utils';
import { LoggerService } from '@/core/logger/logger.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { RedisService } from '@/core/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { AppConfig } from 'generated/prisma/client';
import { AppConfigKey } from './configs';
import { ConfigDto } from './dto';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.logger.setModuleName(AppConfigService.name);
  }

  public async enabled(config: AppConfigKey): Promise<boolean> {
    const cacheKey = `app-config:config:${config}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return cached === '1';
    }
    const row: Record<string, boolean>[] = await this.prisma.$queryRaw`
        SELECT enabled FROM app_configs
        WHERE config = ${config}
    `;
    const enabled = row[0].enabled;
    await this.redisService.set(cacheKey, enabled ? '1' : '0', 3600);
    return enabled;
  }

  async getAllConfigs(): Promise<AppConfig[]> {
    return await this.prisma.appConfig.findMany();
  }

  async getConfig(config: string): Promise<AppConfig | null> {
    return this.prisma.appConfig.findUnique({
      where: { config },
    });
  }

  async createConfig(createConfigDto: ConfigDto): Promise<AppConfig> {
    createConfigDto.config = normalizeString(createConfigDto.config);
    try {
      const config: AppConfig = await this.prisma.appConfig.create({
        data: {
          ...createConfigDto,
        },
      });
      this.logger.log(`Config created: ${JSON.stringify(config)}`);
      return config;
    } catch (e) {
      this.logger.error(
        `Failed to create config: ${JSON.stringify(createConfigDto)}`,
        (e as Error)?.stack,
      );
      throw e;
    }
  }

  async updateConfig(updateConfigDto: ConfigDto): Promise<AppConfig> {
    updateConfigDto.config = normalizeString(updateConfigDto.config);
    try {
      const config = await this.prisma.appConfig.update({
        where: { config: updateConfigDto.config },
        data: {
          ...updateConfigDto,
        },
      });
      this.logger.log(`Config updated: ${JSON.stringify(config)}`);
      return config;
    } catch (e) {
      this.logger.error(
        `Failed to update config: ${JSON.stringify(updateConfigDto)}`,
        (e as Error)?.stack,
      );
      throw e;
    }
  }

  async deleteConfig(config: string): Promise<AppConfig | void> {
    const normalizedConfig = normalizeString(config);
    try {
      const config = await this.prisma.appConfig.delete({
        where: { config: normalizedConfig },
      });
      this.logger.log(`Config deleted: ${JSON.stringify(config)}`);
      return config;
    } catch (e) {
      this.logger.error(
        `Failed to delete config: ${normalizedConfig}`,
        (e as Error)?.stack,
      );
      throw e;
    }
  }
}
