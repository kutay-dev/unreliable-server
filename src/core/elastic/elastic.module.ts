import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ElasticsearchModule,
  ElasticsearchService,
} from '@nestjs/elasticsearch';
import { LoggerService } from '../logger/logger.service';
import { isProd } from '@/common/utils/common.utils';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.getOrThrow<string>('ELASTIC_SEARCH_NODE'),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [ElasticsearchModule],
})
export class ElasticModule implements OnModuleInit {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(ElasticModule.name);
  }

  async onModuleInit() {
    if (!isProd) return;
    try {
      await this.elasticsearchService.ping();
      this.logger.log('Elasticsearch successfully started');
    } catch (error) {
      this.logger.error(
        'Elasticsearch failed to start',
        (error as Error).stack,
      );
    }
  }
}
