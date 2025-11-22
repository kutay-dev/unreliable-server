import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ChatService } from '../chat.service';
import { ChatGateway } from '../chat.gateway';
import { S3Service } from '@/core/aws/s3/s3.service';
import { LoggerService } from '@/core/logger/logger.service';
import { SendMessageDto } from '../dto';

@Processor('scheduled-messages')
@Injectable()
export class MessageProcessor extends WorkerHost {
  constructor(
    private readonly logger: LoggerService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly s3Service: S3Service,
  ) {
    logger.setModuleName(MessageProcessor.name);
    super();
  }

  async process(
    job: Job<SendMessageDto & { authorId: string }>,
  ): Promise<void> {
    const started = Date.now();
    this.logger.log(`Processing scheduled-messages:send-message id=${job.id}`);
    try {
      const { chatId, authorId, text, uniqueFileName } = job.data;
      const message = await this.chatService.sendMessage({
        chatId,
        authorId,
        text,
        uniqueFileName: uniqueFileName ?? undefined,
      });

      const imageUrl = message.imageUrl
        ? await this.s3Service.presignDownloadUrl(message.imageUrl)
        : null;

      this.chatGateway.server
        .to(`chat:${chatId}`)
        .emit('message:sent', { ...message, imageUrl });
      this.logger.log(
        `Process completed id=${job.id} in ${Date.now() - started}ms`,
      );
    } catch (err) {
      this.logger.error(
        `Process failed id=${job.id}`,
        (err as Error).stack ?? String(err),
      );
      throw err;
    }
  }
}
