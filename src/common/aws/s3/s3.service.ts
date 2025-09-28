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

  constructor(private readonly configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    this.s3BucketName = this.configService.getOrThrow('AWS_S3_BUCKET_NAME');
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async presignUploadUrl(fileName: string, fileType: string) {
    const command = new PutObjectCommand({
      Bucket: this.s3BucketName,
      Key: fileName,
      ContentType: fileType,
    });
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 60 * 10,
    });
  }

  async presignDownloadUrl(fileName: string) {
    const command = new GetObjectCommand({
      Bucket: this.s3BucketName,
      Key: fileName,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 60 * 10,
    });
  }
}
