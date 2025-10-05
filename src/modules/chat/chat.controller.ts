import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ChatAuthGuard } from './guards';
import { JwtGuard } from '@/modules/auth/jwt.guard';
import { CreateChatDto } from './dto';
import { S3Service } from '@/common/aws/s3/s3.service';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('list')
  listChats(@CurrentUser() user: User) {
    return this.chatService.listChats(user.id);
  }

  @UseGuards(ChatAuthGuard)
  @Post('join/:id')
  async joinChat(@Param('id') chatId: string, @CurrentUser() user: User) {
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

  @Get('get-upload-url')
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    return await this.s3Service.presignUploadUrl(fileName, fileType);
  }
}
