import { ConfigEnabled } from '@/common/decorators/config-enabled.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { FromCache, Role } from '@/common/enums';
import { AppConfigGuard } from '@/common/guards/app-config.guard';
import { JwtGuard } from '@/common/guards/jwt.guard';
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
import { AppConfigs } from '../app-config/configs';
import { ChatService } from './chat.service';
import {
  ChatConnectionDto,
  CreateChatDto,
  GenerateMessageDto,
  GetMessagesDto,
  LogIntoChatDto,
  ScheduleMessageDto,
  SearchMessageDto,
  SendAIMessageDto,
} from './dto';
import { MembershipGuard } from './guards';
import { Membership, MessageWithCosineSimilarity } from './types';

@UseGuards(JwtGuard, AppConfigGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly s3Service: S3Service,
    private readonly bullmqService: BullmqService,
  ) {}

  @Get('list-user-chats')
  async listUserChats(
    @CurrentUser() user: User,
  ): Promise<{ id: string; name: string; type: ChatType }[]> {
    return await this.chatService.listUserChats(user.id);
  }

  @Post('create-chat')
  async createChat(
    @Body() createChatDto: CreateChatDto,
  ): Promise<Partial<Chat>> {
    return await this.chatService.createChat(createChatDto);
  }

  @Post('join/:id')
  async joinChat(
    @Param('id') chatId: string,
    @CurrentUser() user: User,
  ): Promise<Membership> {
    return await this.chatService.validateMembership(user.id, chatId);
  }

  @Post('log-into-chat')
  async logIntoChat(
    @Body() logIntoChatDto: LogIntoChatDto,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return await this.chatService.logIntoChat(logIntoChatDto, user.id);
  }

  @UseGuards(MembershipGuard)
  @Get('get-messages')
  async getMessages(
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<{ data: Message[]; fromCache: FromCache }> {
    return this.chatService.getMessages(getMessagesDto);
  }

  @UseGuards(MembershipGuard)
  @Get('get-read-status')
  async getReadStatus(@Query() chatConnectionDto: ChatConnectionDto): Promise<
    {
      id: string;
      lastSeenMessageId: string;
      updatedAt: Date;
      user: { id: string; username: string };
    }[]
  > {
    return this.chatService.getReadStatus(chatConnectionDto);
  }

  @UseGuards(MembershipGuard)
  @Get('search-message')
  async searchMessage(
    @Query() searchMessageDto: SearchMessageDto,
  ): Promise<Message[]> {
    return this.chatService.searchMessage(searchMessageDto);
  }

  @UseGuards(MembershipGuard)
  @ConfigEnabled(AppConfigs.SemanticSearchEnabled)
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

  @UseGuards(MembershipGuard)
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
  async generateIncrementingMessages(
    @Body() generateMessageDto: GenerateMessageDto,
  ): Promise<Message[]> {
    return await this.chatService.generateIncrementingMessages(
      generateMessageDto,
    );
  }

  @Roles(Role.GOD)
  @Post('generate-sentences')
  async generateSentences(
    @Body() generateMessageDto: GenerateMessageDto,
  ): Promise<BatchPayload> {
    return await this.chatService.generateSentences(generateMessageDto);
  }
}
