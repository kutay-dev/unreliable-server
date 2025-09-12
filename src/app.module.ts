import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { ChatService } from './modules/chat/chat.service';
import { UserService } from './modules/user/user.service';
import { UserController } from './modules/user/user.controller';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ChatModule,
    UserModule,
  ],
  providers: [ChatGateway, ChatService, UserService],
  controllers: [UserController],
})
export class AppModule {}
