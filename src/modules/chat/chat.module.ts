import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { BullModule } from '@nestjs/bullmq';
import { MessageProcessor } from './processors/message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scheduled-messages',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, MessageProcessor],
})
export class ChatModule {}
