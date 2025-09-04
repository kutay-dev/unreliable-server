import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatService } from './chat/chat.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ChatModule],
  providers: [ChatGateway, ChatService],
})
export class AppModule {}
