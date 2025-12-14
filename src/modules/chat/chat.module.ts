import { AppConfigModule } from '@/modules/app-config/app-config.module';
import { AppConfigService } from '@/modules/app-config/app-config.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageProcessor } from './processors/message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scheduled-messages',
    }),
    AppConfigModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, MessageProcessor, AppConfigService],
  exports: [ChatService],
})
export class ChatModule {}
