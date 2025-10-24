import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { S3Service } from '@/core/aws/s3/s3.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class AwsModule {}
