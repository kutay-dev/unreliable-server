import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  CreateChatDto,
  GenerateIncrementingMessageDto,
  GetMessagesDto,
  SendMessageDto,
} from './dto';
import { S3Service } from '@/common/aws/s3/s3.service';
import { Message } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createChat(createChatDto: CreateChatDto) {
    return await this.prisma.chat.create({
      data: {
        name: createChatDto.name,
        type: createChatDto.type,
        password: createChatDto.password,
      },
    });
  }

  async validateChatMember(userId: string, chatId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } },
      select: { id: true },
    });
    return !!member;
  }

  async insertMember({ userId, chatId }: { userId: string; chatId: string }) {
    return await this.prisma.chatMember.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: { userId, chatId },
      update: {},
    });
  }

  async listChats(userId: string) {
    return await this.prisma.chat.findMany({
      where: {
        OR: [
          { type: 'PUBLIC' },
          {
            type: 'PRIVATE',
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
  }

  async getMessages(getMessagesDto: GetMessagesDto) {
    const messages: Message[] = await this.prisma.message.findMany({
      where: { chatId: getMessagesDto.chatId },
      orderBy: { id: 'desc' },
      take: getMessagesDto.limit,
      cursor: getMessagesDto.cursor ? { id: getMessagesDto.cursor } : undefined,
      skip: getMessagesDto.cursor ? 1 : 0,
    });

    messages.reverse();

    return await Promise.all(
      messages.map(async (message) => {
        if (!message.imageUrl) return message;
        const presignedUrl = await this.s3Service.presignDownloadUrl(
          message.imageUrl,
        );
        return { ...message, imageUrl: presignedUrl };
      }),
    );
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    return await this.prisma.message.create({
      data: {
        authorId: sendMessageDto.authorId,
        chatId: sendMessageDto.chatId,
        text: sendMessageDto.text,
        imageUrl: sendMessageDto.uniqueFileName,
      },
    });
  }

  async generate(generateDto: GenerateIncrementingMessageDto) {
    const generatedMessages: Message[] = [];
    for (let i = 0; i < generateDto.generations; i++) {
      const message = await this.prisma.message.create({
        data: {
          authorId: generateDto.authorId,
          chatId: generateDto.chatId,
          text: String(i + 1),
        },
      });
      generatedMessages.push(message);
    }

    return generatedMessages;
  }
}
