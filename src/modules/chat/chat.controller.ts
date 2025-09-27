import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ChatAuthGuard } from './guards';
import { JwtGuard } from '@/modules/auth/jwt.guard';
import { CreateChatDto } from './dto';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('list')
  listChats(@CurrentUser() user: User) {
    return this.chatService.listChats(user.id);
  }

  @UseGuards(ChatAuthGuard)
  @Get(':id')
  async joinChat(@Param('id') chatId: number, @CurrentUser() user: User) {
    const isMember = await this.chatService.validateChatMember(user.id, chatId);
    if (!isMember) {
      await this.chatService.insertMember({ userId: user.id, chatId });
    }
    return this.chatService.listMessages(chatId);
  }

  @Post('create')
  createChat(@Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }
}
