import { ParseJSONPipe } from '@/common/pipes/parse-json.pipe';
import { emitToRoom } from '@/common/utils/common.utils';
import { S3Service } from '@/core/aws/s3/s3.service';
import { LoggerService } from '@/core/logger/logger.service';
import { RedisService } from '@/core/redis/redis.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import {
  ChatConnectionDto,
  CreatePollDto,
  DeleteMessageDto,
  ReadMessageDto,
  SendMessageDto,
  UpdateMessageDto,
  VoteForPollDto,
} from './dto';
import { MembershipGuard } from './guards';

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.logger.setModuleName(ChatGateway.name);
  }

  handleConnection(client: Socket): void {
    try {
      const token: string =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch {
      this.logger.warn(`user ${client?.data?.user?.sub} couldn't connect`);
      client.disconnect();
    }
  }

  @WebSocketServer() server: Server;

  private chatName = (chatId: string) => `chat:${chatId}`;

  @SubscribeMessage('ping')
  async ping(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) chatConnectionDto: ChatConnectionDto,
  ): Promise<void> {
    const userId = client?.data?.user?.sub;
    try {
      await this.redisService.set(`user:${userId}:online`, true, 30);

      emitToRoom({
        client,
        server: this.server,
        chatId: chatConnectionDto.chatId,
        socket: 'user:online',
        payload: { userId },
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to process ping', {
        userId,
        chatId: chatConnectionDto.chatId,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) joinChatDto: ChatConnectionDto,
  ): Promise<void> {
    const chatName = this.chatName(joinChatDto.chatId);
    const userId = client?.data?.user?.sub;
    try {
      await client.join(chatName);

      emitToRoom({
        client,
        server: this.server,
        chatId: joinChatDto.chatId,
        socket: 'chat:join',
        payload: { userId },
      });

      this.logger.log(`author ${userId} connected to ${chatName}`);
    } catch (error) {
      this.handleWsError(error, `Failed to join chat ${chatName}`, {
        userId,
        chatId: joinChatDto.chatId,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('chat:leave')
  async leaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) leaveChatDto: ChatConnectionDto,
  ): Promise<void> {
    const chatId = leaveChatDto.chatId;
    try {
      await client.leave(this.chatName(chatId));
      client.emit('chat:leave', { chatId });
    } catch (error) {
      this.handleWsError(error, `Failed to leave chat ${chatId}`, {
        chatId,
        userId: client?.data?.user?.sub,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) sendMessageDto: SendMessageDto,
  ): Promise<void> {
    const { chatId, text, uniqueFileName } = sendMessageDto;
    const authorId = client?.data?.user?.sub;
    try {
      const imageUrl = uniqueFileName
        ? await this.s3Service.presignDownloadUrl(uniqueFileName)
        : null;

      const message = await this.chatService.sendMessage({
        chatId,
        authorId,
        text,
        uniqueFileName,
      });

      this.server
        .to(this.chatName(chatId))
        .emit('message:sent', { ...message, imageUrl });
    } catch (error) {
      this.handleWsError(error, `Failed to send message to chat ${chatId}`, {
        chatId,
        authorId,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('message:update')
  async updateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) updateMessageDto: UpdateMessageDto,
  ): Promise<void> {
    try {
      const message = await this.chatService.editMessage(
        updateMessageDto.messageId,
        updateMessageDto.text,
      );

      emitToRoom({
        client,
        server: this.server,
        chatId: message.chatId,
        socket: 'message:updated',
        payload: {
          messageId: updateMessageDto.messageId,
          text: updateMessageDto.text,
        },
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to update message', {
        messageId: updateMessageDto.messageId,
        userId: client?.data?.user?.sub,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('message:delete')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) deleteMessageDto: DeleteMessageDto,
  ): Promise<void> {
    try {
      const message = await this.chatService.deleteMessage(
        deleteMessageDto.messageId,
      );

      emitToRoom({
        client,
        server: this.server,
        chatId: message.chatId,
        socket: 'message:deleted',
        payload: {
          messageId: deleteMessageDto.messageId,
        },
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to delete message', {
        messageId: deleteMessageDto.messageId,
        userId: client?.data?.user?.sub,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('message:read')
  async readMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) readMessageDto: ReadMessageDto,
  ): Promise<void> {
    const userId = client?.data?.user?.sub;
    try {
      const seenMessage = await this.chatService.readMessage({
        ...readMessageDto,
        userId,
      });

      emitToRoom({
        client,
        server: this.server,
        chatId: readMessageDto.chatId,
        socket: 'message:seen',
        payload: seenMessage,
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to mark message as read', {
        chatId: readMessageDto.chatId,
        userId,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('poll:create')
  async createPoll(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) createPollDto: CreatePollDto,
  ): Promise<void> {
    const userId = client?.data?.user?.sub;
    try {
      const poll = await this.chatService.createPoll({
        ...createPollDto,
        userId,
      });

      emitToRoom({
        client,
        server: this.server,
        chatId: createPollDto.chatId,
        socket: 'poll:created',
        payload: poll,
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to create poll', {
        chatId: createPollDto.chatId,
        userId,
      });
    }
  }

  @UseGuards(MembershipGuard)
  @SubscribeMessage('poll:vote')
  async voteForPoll(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) voteForPollDto: VoteForPollDto,
  ): Promise<void> {
    const userId = client?.data?.user?.sub;
    try {
      const vote = await this.chatService.voteForPoll({
        ...voteForPollDto,
        userId,
      });

      emitToRoom({
        client,
        server: this.server,
        chatId: voteForPollDto.chatId,
        socket: 'poll:receive:vote',
        payload: vote,
      });
    } catch (error) {
      this.handleWsError(error, 'Failed to vote on poll', {
        chatId: voteForPollDto.chatId,
        userId,
        optionId: voteForPollDto.optionId,
      });
    }
  }

  private handleWsError(
    error: unknown,
    errorMessage: string,
    meta?: Record<string, unknown>,
  ): never {
    this.logger.error(
      errorMessage,
      error instanceof Error ? error.stack : String(error),
      meta,
    );
    throw new WsException(errorMessage);
  }
}
