import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { MessageWithCosineSimilarity } from '@/common/types';
import { S3Service } from '@/core/aws/s3/s3.service';
import { BullmqService } from '@/core/bullmq/bullmq.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Job } from 'bullmq';
import type {
  AIMessage,
  Chat,
  ChatType,
  Message,
  User,
} from 'generated/prisma/client';
import { BatchPayload } from 'generated/prisma/internal/prismaNamespace';
import { ChatService } from './chat.service';
import {
  ChatConnectionDto,
  CreateChatDto,
  GenerateMessageDto,
  GetMessagesDto,
  ScheduleMessageDto,
  SearchMessageDto,
  SendAIMessageDto,
} from './dto';
import { ChatAuthGuard } from './guards';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly s3Service: S3Service,
    private readonly bullmqService: BullmqService,
  ) {}

  @Get('list')
  listChats(
    @CurrentUser() user: User,
  ): Promise<{ id: string; name: string; type: ChatType }[]> {
    return this.chatService.listChats(user.id);
  }

  @UseGuards(ChatAuthGuard)
  @Post('join/:id')
  async joinChat(@Param('id') chatId: string, @CurrentUser() user: User) {
    const isMember = await this.chatService.validateChatMember(user.id, chatId);
    if (!isMember) {
      await this.chatService.insertMember(user.id, chatId);
    }
    return isMember;
  }

  @Get('get-messages')
  async getMessages(@Query() getMessagesDto: GetMessagesDto) {
    return this.chatService.getMessages(getMessagesDto);
  }

  @Get('get-read-status')
  async getReadStatus(@Query() chatConnectionDto: ChatConnectionDto) {
    return this.chatService.getReadStatus(chatConnectionDto);
  }

  @Get('search-message')
  async searchMessage(
    @Query() searchMessageDto: SearchMessageDto,
  ): Promise<Message[]> {
    return this.chatService.searchMessage(searchMessageDto);
  }

  @Get('ai-search-message')
  async aiSearchMessage(
    @Query() searchMessageDto: SearchMessageDto,
  ): Promise<MessageWithCosineSimilarity[]> {
    return this.chatService.aiSearchMessage(searchMessageDto);
  }

  @Post('send-ai-message')
  async sendAIMessage(
    @Body() sendAIMessageDto: SendAIMessageDto,
    @CurrentUser() user: User,
  ): Promise<AIMessage> {
    return await this.chatService.sendAIMessage(
      sendAIMessageDto.content,
      user.id,
    );
  }

  @Post('schedule-message')
  async scheduleMessage(
    @Body() scheduleMessageDto: ScheduleMessageDto,
    @CurrentUser() user: User,
  ): Promise<
    Job<Message, { chatId: string; authorId: string; text: string }, string>
  > {
    const { chatId, text, uniqueFileName, schedule } = scheduleMessageDto;
    return await this.bullmqService.schedule(
      'scheduled-messages',
      'send-message',
      {
        chatId,
        authorId: user.id,
        text,
        uniqueFileName,
      },
      new Date(Date.parse(schedule) - 10),
    );
  }

  @Post('create')
  async createChat(@Body() createChatDto: CreateChatDto): Promise<Chat> {
    return await this.chatService.createChat(createChatDto);
  }

  @Get('get-upload-url')
  async getUploadUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ): Promise<{
    uniqueFileName: string;
    uploadUrl: string;
  }> {
    return await this.s3Service.presignUploadUrl(fileName, fileType);
  }

  @Roles(Role.GOD)
  @Post('generate-incrementing-messages')
  generateIncrementingMessages(
    @Body() generateMessageDto: GenerateMessageDto,
  ): Promise<Message[]> {
    return this.chatService.generateIncrementingMessages(generateMessageDto);
  }

  @Roles(Role.GOD)
  @Post('generate-sentences')
  generateSentences(
    @Body() generateMessageDto: GenerateMessageDto,
  ): Promise<BatchPayload> {
    return this.chatService.generateSentences(generateMessageDto);
  }
}
