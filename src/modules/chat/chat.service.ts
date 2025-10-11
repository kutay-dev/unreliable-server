import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  CreateChatDto,
  GenerateIncrementingMessageDto,
  GetMessagesDto,
  SendMessageDto,
} from './dto';
import { S3Service } from '@/common/aws/s3/s3.service';
import { AIMessageRole, Message } from '@prisma/client';
import OpenAI from 'openai';
import { RedisService } from '@/core/redis/redis.service';
import { noNulls } from '@/common/utils/common.utils';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
  ) {}

  private readonly client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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
    let messages: Message[];

    if (!getMessagesDto.cursor) {
      const cached = await this.redisService.getLast50Messages(
        getMessagesDto.chatId,
      );

      if (cached.length === 50) {
        messages = cached;
      } else {
        const remaining = 50 - cached.length;
        let remainingMessages: Message[];

        if (cached.length > 0) {
          remainingMessages = await this.prisma.message.findMany({
            where: { chatId: getMessagesDto.chatId, deletedAt: null },
            orderBy: { id: 'desc' },
            cursor: { id: cached[0].id },
            skip: 1,
            take: remaining,
          });
        } else {
          remainingMessages = await this.prisma.message.findMany({
            where: { chatId: getMessagesDto.chatId, deletedAt: null },
            orderBy: { id: 'desc' },
            take: remaining,
          });
        }
        messages = [...remainingMessages.reverse(), ...cached];
      }
    } else {
      messages = await this.prisma.message.findMany({
        where: { chatId: getMessagesDto.chatId, deletedAt: null },
        orderBy: { id: 'desc' },
        take: getMessagesDto.limit,
        cursor: getMessagesDto.cursor
          ? { id: getMessagesDto.cursor }
          : undefined,
        skip: getMessagesDto.cursor ? 1 : 0,
      });
      messages.reverse();
    }

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
    const message = await this.prisma.message.create({
      data: {
        authorId: sendMessageDto.authorId!,
        chatId: sendMessageDto.chatId!,
        text: sendMessageDto.text,
        imageUrl: sendMessageDto.uniqueFileName,
      },
    });

    await this.redisService.addMessage(
      sendMessageDto.chatId!,
      noNulls(message),
    );

    return message;
  }

  async editMessage(id: string, text: string) {
    await this.prisma.message.update({
      where: { id },
      data: {
        text,
      },
    });
  }

  async deleteMessage(id: string) {
    await this.prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
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

  async sendAIMessage(content: string, userId: string) {
    await this.prisma.aIMessage.create({
      data: {
        role: AIMessageRole.USER,
        userId,
        content,
      },
    });

    const chatHistory: { role: any; content: string }[] =
      await this.prisma.aIMessage.findMany({
        where: {
          userId,
        },
        orderBy: {
          id: 'desc',
        },
        select: {
          role: true,
          content: true,
        },
        take: 14,
      });

    chatHistory.reverse().unshift({
      role: 'system',
      content: String(process.env.OPENAI_MODEL_SYSTEM_INSTRUCTIONS),
    });

    const response = await this.client.chat.completions.create({
      model: String(process.env.OPENAI_MODEL),
      messages: chatHistory.map((message) => ({
        ...message,
        role: message.role.toLowerCase(),
      })),
    });

    return await this.prisma.aIMessage.create({
      data: {
        role: AIMessageRole.ASSISTANT,
        userId: userId,
        content: response.choices[0].message.content || 'null',
      },
    });
  }
}
