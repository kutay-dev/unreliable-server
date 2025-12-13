import uuidv4 from '@/common/utils/uuid';
import { LoggerService } from '@/core/logger/logger.service';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private s3BucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(S3Service.name);
    try {
      this.initializeClients();
      this.logger.log('Successfully initialized S3 client');
    } catch (error) {
      this.logger.error(
        'Failed to initialize S3 client',
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  private initializeClients(): void {
    this.s3BucketName = this.configService.getOrThrow('AWS_S3_BUCKET_NAME');
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async presignUploadUrl(
    fileName: string,
    fileType: string,
  ): Promise<{ uniqueFileName: string; uploadUrl: string }> {
    try {
      const uniqueFileName = `${uuidv4()}_${fileName}`;
      const command = new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: uniqueFileName,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 10,
      });

      this.logger.log(`Generated upload URL for file: ${uniqueFileName}`);
      return {
        uniqueFileName,
        uploadUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to presign upload URL for ${fileName}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async presignDownloadUrl(fileName: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3BucketName,
        Key: fileName,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 10,
      });

      return downloadUrl;
    } catch (error) {
      this.logger.error(
        `Failed to presign download URL for ${fileName}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }
}
