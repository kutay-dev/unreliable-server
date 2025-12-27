import { FromCache } from '@/common/enums';
import {
  getRandomSentence,
  noNulls,
  vectorize,
} from '@/common/utils/common.utils';
import { S3Service } from '@/core/aws/s3/s3.service';
import { LoggerService } from '@/core/logger/logger.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ChatCacheService } from '@/core/redis/cache/chat-cache.service';
import { RedisService } from '@/core/redis/redis.service';
import { AppConfigService } from '@/modules/app-config/app-config.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import {
  AIMessage,
  AIMessageRole,
  Chat,
  ChatMember,
  ChatType,
  Message,
  Poll,
  PollVote,
  Prisma,
  ReadStatus,
} from 'generated/prisma/client';
import { BatchPayload } from 'generated/prisma/internal/prismaNamespace';
import OpenAI from 'openai';
import { AppConfigs } from '../app-config/configs';
import {
  ChatConnectionDto,
  CreateChatDto,
  CreatePollDto,
  GenerateMessageDto,
  GetMessagesDto,
  LogIntoChatDto,
  ReadMessageDto,
  SearchMessageDto,
  SendMessageDto,
  VoteForPollDto,
} from './dto';
import { Membership, MessageWithCosineSimilarity } from './types';

@Injectable()
export class ChatService {
  private readonly aiClient: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
    private readonly chatCacheService: ChatCacheService,
    private readonly logger: LoggerService,
    private readonly appConfig: AppConfigService,
  ) {
    this.logger.setModuleName(ChatService.name);
    this.aiClient = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  private handleServiceError(
    error: unknown,
    errorMessage: string,
    meta?: Record<string, unknown>,
  ): never {
    this.logger.error(
      errorMessage,
      error instanceof Error ? error.stack : String(error),
      meta,
    );
    throw new InternalServerErrorException(errorMessage);
  }

  async createChat(createChatDto: CreateChatDto): Promise<Partial<Chat>> {
    const { name, type, password } = createChatDto;
    const chatType = type ?? ChatType.PRIVATE;

    if (chatType === ChatType.PRIVATE && !password) {
      throw new BadRequestException('Private chats must have a password');
    }
    const hash =
      chatType === ChatType.PRIVATE && password
        ? await argon.hash(password)
        : undefined;

    return this.prisma.chat.create({
      data: {
        name,
        type: chatType,
        password: hash ?? null,
      },
      select: {
        name: true,
        type: true,
      },
    });
  }

  async logIntoChat(
    logIntoChatDto: LogIntoChatDto,
    userId: string,
  ): Promise<boolean> {
    const { chatId, password } = logIntoChatDto;
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true, password: true },
    });
    if (chat?.type === ChatType.PUBLIC) {
      await this.insertMember(userId, chatId);
      return true;
    }
    const passwordMatches = await argon.verify(chat!.password!, password!);
    if (passwordMatches) {
      await this.insertMember(userId, chatId);
      return true;
    }
    throw new UnauthorizedException('Incorrect password');
  }

  async validateMembership(
    userId: string,
    chatId: string,
  ): Promise<Membership> {
    const chatMemberRows: Membership = await this.prisma.$queryRaw`
        SELECT c.type, cm.id
        FROM chats AS c
        LEFT JOIN chat_members AS cm ON cm.chat_id = c.id AND cm.user_id = ${userId}
        WHERE c.id = ${chatId}
        LIMIT 1
    `;
    const chatMember: Membership = chatMemberRows[0];
    return chatMember;
  }

  async insertMember(userId: string, chatId: string): Promise<ChatMember> {
    return await this.prisma.chatMember.create({
      data: { userId, chatId },
    });
  }

  async listUserChats(
    userId: string,
  ): Promise<{ id: string; name: string; type: ChatType }[]> {
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

  async getMessages(
    getMessagesDto: GetMessagesDto,
  ): Promise<{ data: Message[]; fromCache: FromCache }> {
    const { chatId, cursor, limit } = getMessagesDto;

    try {
      let messages: Message[];
      let fromCache: FromCache = FromCache.FALSE;

      const getMessagesQuery: Prisma.MessageFindManyArgs = {
        where: { chatId, deletedAt: null },
        select: {
          id: true,
          authorId: true,
          text: true,
          imageUrl: true,
          createdAt: true,
          author: {
            select: {
              username: true,
            },
          },
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
    } catch (error) {
      this.handleServiceError(
        error,
        `Failed to fetch messages for chat ${chatId}`,
        { chatId, cursor },
      );
    }
  }

  async getReadStatus(chatConnectionDto: ChatConnectionDto): Promise<
    {
      id: string;
      lastSeenMessageId: string;
      updatedAt: Date;
      user: { id: string; username: string };
    }[]
  > {
    return await this.prisma.readStatus.findMany({
      where: { chatId: chatConnectionDto.chatId },
      select: {
        id: true,
        lastSeenMessageId: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async searchMessage(searchMessageDto: SearchMessageDto): Promise<Message[]> {
    const { chatId, query } = searchMessageDto;

    return await this.prisma.$queryRaw`
      SELECT m.id, m.author_id, m.text, m.image_url, m.created_at,
        json_build_object(
          'username', u.username
        ) AS author
      FROM messages AS m
      LEFT JOIN users AS u ON u.id = m.author_id
      WHERE m.chat_id = ${chatId}::uuid
        AND m.deleted_at IS NULL
        AND m.text ILIKE '%' || ${query} || '%'
      ORDER BY m.created_at ASC
      LIMIT 20
    `;
  }

  async aiSearchMessage(
    searchMessageDto: SearchMessageDto,
  ): Promise<MessageWithCosineSimilarity[]> {
    if (!(await this.appConfig.enabled(AppConfigs.SemanticSearchEnabled))) {
      throw new ServiceUnavailableException();
    }
    const { query, chatId } = searchMessageDto;
    try {
      const optimizedQueryRaw = await this.aiClient.chat.completions.create({
        model: this.configService.getOrThrow<string>(
          'OPENAI_SEARCH_QUERY_OPTIMIZER_MODEL',
        ),
        messages: [
          {
            role: 'system',
            content: this.configService.getOrThrow<string>(
              'OPENAI_SEARCH_QUERY_OPTIMIZER_INSTRUCTIONS',
            ),
          },
          { role: 'user', content: query },
        ],
        temperature: +this.configService.getOrThrow<string>(
          'OPENAI_SEARCH_QUERY_OPTIMIZER_TEMP',
        ),
      });

      const optimizedQuery: string | undefined =
        optimizedQueryRaw.choices[0].message.content?.trim();

      const vector = optimizedQuery && (await vectorize(optimizedQuery));

      const semanticSearchResult: MessageWithCosineSimilarity[] = await this
        .prisma.$queryRaw`
      SELECT m.id, m.author_id, m.text, m.image_url, m.created_at,
        json_build_object(
          'username', u.username
        ) AS author,
        1 - (embedding <=> ${vector}::vector) as cosine_similarity
      FROM messages AS m
      LEFT JOIN users AS u ON u.id = m.author_id
      WHERE chat_id = ${chatId}
        AND deleted_at IS NULL
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector ASC
      LIMIT 20;
    `;

      const reRankingPrompt = this.configService
        .getOrThrow<string>('OPENAI_SEMANTIC_SEARCH_RE_RANKING_PROMPT')
        .replace('<original_query>', query)
        .replace(
          '<semanticSearchResult>',
          JSON.stringify(
            semanticSearchResult.map((m) => ({ id: m.id, text: m.text })),
          ),
        );

      const reRankedIdsRaw = await this.aiClient.chat.completions.create({
        model: this.configService.getOrThrow<string>(
          'OPENAI_SEMANTIC_SEARCH_RE_RANKING_MODEL',
        ),
        messages: [
          {
            role: 'system',
            content: this.configService.getOrThrow<string>(
              'OPENAI_SEMANTIC_SEARCH_RE_RANKING_INSTRUCTIONS',
            ),
          },
          { role: 'user', content: reRankingPrompt },
        ],
        temperature: +this.configService.getOrThrow<string>(
          'OPENAI_SEMANTIC_SEARCH_RE_RANKING_TEMP',
        ),
      });

      const reRankedIds: string[] | undefined =
        reRankedIdsRaw.choices[0].message.content
          ?.split(',')
          .map((id) => id.trim());

      const validateIds = (
        reRankedIds: unknown,
        semanticSearchResult: MessageWithCosineSimilarity[],
      ): boolean => {
        const semanticSearchResultIds = semanticSearchResult.map((m) => m.id);
        if (!Array.isArray(reRankedIds)) return false;
        if (reRankedIds.length !== semanticSearchResultIds.length) return false;

        for (const id of reRankedIds) {
          if (typeof id !== 'string') return false;
          if (!semanticSearchResultIds.includes(id)) return false;
        }
        const set = new Set(reRankedIds);
        if (set.size !== reRankedIds.length) return false;

        return true;
      };

      if (validateIds(reRankedIds, semanticSearchResult)) {
        const order = new Map(reRankedIds?.map((id, i) => [id, i]));
        return semanticSearchResult.sort(
          (a, b) => order.get(a.id)! - order.get(b.id)!,
        );
      }

      this.logger.warn(
        `Couldn't validate LLM's re-ranking ${JSON.stringify(reRankedIds)}`,
      );
      return semanticSearchResult;
    } catch (error) {
      this.handleServiceError(
        error,
        `Semantic search failed for chat ${chatId}`,
        { chatId, query },
      );
    }
  }

  async sendMessage(
    sendMessageDto: SendMessageDto & { authorId: string },
  ): Promise<Message> {
    const { authorId, chatId, text, uniqueFileName } = sendMessageDto;

    try {
      const vector: string | undefined =
        text &&
        (await this.appConfig.enabled(AppConfigs.MessageEmbeddingEnabled))
          ? await vectorize(text)
          : undefined;

      return await this.prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            authorId,
            chatId,
            text,
            imageUrl: uniqueFileName,
          },
          include: { author: { select: { username: true } } },
        });

        if (text) {
          await tx.$executeRaw`
        UPDATE messages
        SET embedding = ${vector}::vector
        WHERE id = ${message.id}
      `;
        }
        await this.chatCacheService.addMessage(chatId, noNulls(message));
        return message;
      });
    } catch (error) {
      this.handleServiceError(
        error,
        `Failed to send message to chat ${chatId}`,
        { chatId, authorId },
      );
    }
  }

  async editMessage(id: string, text: string): Promise<Message> {
    const editedMessage = await this.prisma.message.update({
      where: { id },
      data: {
        text,
      },
    });

    await this.redisService.del(`chat:${editedMessage.chatId}:messages:last50`);
    return editedMessage;
  }

  async deleteMessage(id: string): Promise<Message> {
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

  async readMessage(
    readMessageDto: ReadMessageDto & { userId: string },
  ): Promise<ReadStatus> {
    const { chatId, lastSeenMessageId, userId } = readMessageDto;

    return await this.prisma.readStatus.upsert({
      where: { userId_chatId: { userId, chatId } },
      create: { userId, chatId, lastSeenMessageId },
      update: { lastSeenMessageId, updatedAt: new Date() },
    });
  }

  async generateIncrementingMessages(
    generateMessageDto: GenerateMessageDto,
  ): Promise<Message[]> {
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

  async generateSentences(
    generateMessageDto: GenerateMessageDto,
  ): Promise<BatchPayload> {
    const { count, authorId, chatId } = generateMessageDto;

    return await this.prisma.message.createMany({
      data: Array.from({ length: count }, () => ({
        authorId,
        chatId,
        text: getRandomSentence(),
      })),
    });
  }

  async sendAIMessage(content: string, userId: string): Promise<AIMessage> {
    try {
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
    } catch (error) {
      this.handleServiceError(
        error,
        `Failed to generate AI response for user ${userId}`,
        { userId },
      );
    }
  }

  async createPoll(
    createPollDto: CreatePollDto & { userId: string },
  ): Promise<Poll> {
    const { title, chatId, userId, options } = createPollDto;

    try {
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
    } catch (error) {
      this.handleServiceError(
        error,
        `Failed to create poll in chat ${chatId}`,
        { chatId, userId },
      );
    }
  }

  async voteForPoll(
    voteForPollDto: VoteForPollDto & { userId: string },
  ): Promise<PollVote> {
    const { userId, optionId } = voteForPollDto;

    try {
      await this.redisService.del(
        `chat:${voteForPollDto.chatId}:messages:last50`,
      );
      return await this.prisma.pollVote.create({
        data: {
          userId,
          optionId,
        },
      });
    } catch (error) {
      this.handleServiceError(
        error,
        `Failed to vote for poll option ${optionId}`,
        { chatId: voteForPollDto.chatId, userId, optionId },
      );
    }
  }
}
