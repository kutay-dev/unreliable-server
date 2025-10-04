import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateChatDto, SendMessageDto } from './dto';
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

  async validateChatMember(userId: number, chatId: number) {
    const member = await this.prisma.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } },
      select: { id: true },
    });
    return !!member;
  }

  async insertMember({ userId, chatId }) {
    return await this.prisma.chatMember.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: { userId, chatId },
      update: {},
    });
  }

  async listChats(userId: number) {
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

  async listMessages(chatId: number) {
    const messages: Message[] = await this.prisma.message.findMany({
      where: { chatId },
    });
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].imageUrl) {
        messages[i].imageUrl = await this.s3Service.presignDownloadUrl(
          messages[i].imageUrl!,
        );
      }
    }
    return messages;
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
}
