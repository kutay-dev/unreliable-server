import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  CreateChatDto,
  SendMessageDto,
  CreatePollDto,
  GenerateMessageDto,
  GetMessagesDto,
  SearchMessageDto,
  VoteForPollDto,
} from './dto';
import { S3Service } from '@/core/aws/s3/s3.service';
import { AIMessageRole, Message, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { getRandomSentence, noNulls } from '@/common/utils/common.utils';
import { ChatCacheService } from '@/core/redis/cache/chat-cache.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/core/redis/redis.service';
import { FromCache } from '@/common/enums';

@Injectable()
export class ChatService {
  private readonly aiClient: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
    private readonly chatCacheService: ChatCacheService,
  ) {
    this.aiClient = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async createChat(createChatDto: CreateChatDto) {
    const { name, type, password } = createChatDto;

    return await this.prisma.chat.create({
      data: {
        name,
        type,
        password,
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

  async insertMember(userId: string, chatId: string) {
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
    const { chatId, cursor, limit } = getMessagesDto;

    let messages: Message[];
    let fromCache: FromCache = FromCache.FALSE;

    const getMessagesQuery: Prisma.MessageFindManyArgs = {
      where: { chatId, deletedAt: null },
      include: {
        poll: {
          select: {
            id: true,
            title: true,
            options: {
              select: {
                id: true,
                text: true,
                votes: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    if (!cursor) {
      const cached = await this.chatCacheService.getLast50Messages(chatId);
      if (cached.length === 50) {
        messages = cached;
        fromCache = FromCache.TRUE;
      } else {
        const remaining = 50 - cached.length;
        let remainingMessages: Message[];

        if (cached.length > 0) {
          remainingMessages = await this.prisma.message.findMany({
            ...getMessagesQuery,
            cursor: { id: cached[0].id },
            skip: 1,
            take: remaining,
            orderBy: { id: 'desc' },
          });
          fromCache = FromCache.PARTIAL;
        } else {
          remainingMessages = await this.prisma.message.findMany({
            ...getMessagesQuery,
            take: remaining,
            orderBy: { id: 'desc' },
          });
        }
        messages = [...remainingMessages.reverse(), ...cached];
      }
    } else {
      messages = await this.prisma.message.findMany({
        ...getMessagesQuery,
        take: limit,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: { id: 'desc' },
      });
      messages.reverse();
    }

    const data = await Promise.all(
      messages.map(async (message) => {
        if (!message.imageUrl) return message;
        const presignedUrl = await this.s3Service.presignDownloadUrl(
          message.imageUrl,
        );
        return { ...message, imageUrl: presignedUrl };
      }),
    );

    return { data, fromCache };
  }

  async searchMessage(searchMessageDto: SearchMessageDto) {
    const { chatId, query } = searchMessageDto;

    return await this.prisma.message.findMany({
      where: {
        chatId,
        text: { contains: query, mode: 'insensitive' },
        deletedAt: null,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendMessage(sendMessageDto: SendMessageDto & { authorId: string }) {
    const { authorId, chatId, text, uniqueFileName } = sendMessageDto;

    const message = await this.prisma.message.create({
      data: {
        authorId,
        chatId,
        text,
        imageUrl: uniqueFileName,
      },
    });

    await this.chatCacheService.addMessage(chatId, noNulls(message));
    return message;
  }

  async editMessage(id: string, text: string) {
    const editedMessage = await this.prisma.message.update({
      where: { id },
      data: {
        text,
      },
    });

    await this.redisService.del(`chat:${editedMessage.chatId}:messages:last50`);
    return editedMessage;
  }

  async deleteMessage(id: string) {
    const deletedMessage = await this.prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.redisService.del(
      `chat:${deletedMessage.chatId}:messages:last50`,
    );

    return deletedMessage;
  }

  async generateIncrementingMessages(generateMessageDto: GenerateMessageDto) {
    const { count, authorId, chatId } = generateMessageDto;

    const generatedMessages: Message[] = [];
    for (let i = 0; i < count; i++) {
      const message = await this.prisma.message.create({
        data: {
          authorId,
          chatId,
          text: String(i + 1),
        },
      });
      generatedMessages.push(message);
    }

    return generatedMessages;
  }

  async generateSentences(generateMessageDto: GenerateMessageDto) {
    const { count, authorId, chatId } = generateMessageDto;

    return await this.prisma.message.createMany({
      data: Array.from({ length: count }, () => ({
        authorId,
        chatId,
        text: getRandomSentence(),
      })),
    });
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
      content: this.configService.getOrThrow<string>(
        'OPENAI_MODEL_SYSTEM_INSTRUCTIONS',
      ),
    });

    const response = await this.aiClient.chat.completions.create({
      model: this.configService.getOrThrow<string>('OPENAI_MODEL'),
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

  async createPoll(createPollDto: CreatePollDto & { userId: string }) {
    const { title, chatId, userId, options } = createPollDto;

    const poll = await this.prisma.poll.create({
      data: {
        title,
        message: {
          create: {
            chatId,
            authorId: userId,
          },
        },
        options: {
          createMany: {
            data: options.map((text) => ({ text })),
          },
        },
      },
      include: {
        message: true,
        options: {
          select: {
            id: true,
            text: true,
            votes: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    const messageWithPoll = {
      ...poll.message,
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options,
      },
    };

    await this.chatCacheService.addMessage(chatId, noNulls(messageWithPoll));
    return poll;
  }

  async voteForPoll(voteForPollDto: VoteForPollDto & { userId: string }) {
    const { userId, optionId } = voteForPollDto;

    await this.redisService.del(
      `chat:${voteForPollDto.chatId}:messages:last50`,
    );
    return await this.prisma.pollVote.create({
      data: {
        userId,
        optionId,
      },
    });
  }
}
