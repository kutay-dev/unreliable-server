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
import { JwtGuard } from '@/common/guards/jwt.guard';
import {
  ChatConnectionDto,
  CreateChatDto,
  GenerateMessageDto,
  GetMessagesDto,
  ScheduleMessageDto,
  SendAIMessageDto,
} from './dto';
import { S3Service } from '@/core/aws/s3/s3.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';
import { BullmqService } from '@/core/bullmq/bullmq.service';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly s3Service: S3Service,
    private readonly bullmqService: BullmqService,
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
    @Query('chatId') chatId: string,
    @Query('query') query: string,
  ) {
    return this.chatService.searchMessage({ chatId, query });
  }

  @Post('send-ai-message')
  async sendAIMessage(
    @Body() sendAIMessageDto: SendAIMessageDto,
    @CurrentUser() user: User,
  ) {
    return await this.chatService.sendAIMessage(
      sendAIMessageDto.content,
      user.id,
    );
  }

  @Post('schedule-message')
  async scheduleMessage(
    @Body() scheduleMessageDto: ScheduleMessageDto,
    @CurrentUser() user: User,
  ) {
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

  @Roles(Role.GOD)
  @Post('generate-incrementing')
  generateIncrementingMessages(@Body() generateMessageDto: GenerateMessageDto) {
    return this.chatService.generateIncrementingMessages(generateMessageDto);
  }

  @Roles(Role.GOD)
  @Post('generate-sentence')
  generateSentences(@Body() generateMessageDto: GenerateMessageDto) {
    return this.chatService.generateSentences(generateMessageDto);
  }
}
