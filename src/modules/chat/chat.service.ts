import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateChatDto } from './dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

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
    return await this.prisma.message.findMany({
      where: { chatId },
    });
  }

  async sendMessage({ authorId, chatId, text }) {
    return await this.prisma.message.create({
      data: {
        authorId,
        chatId,
        text,
      },
    });
  }
}
