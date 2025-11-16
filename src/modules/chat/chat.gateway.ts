import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import {
  ChatConnectionDto,
  SendMessageDto,
  CreatePollDto,
  DeleteMessageDto,
  UpdateMessageDto,
  VoteForPollDto,
  ReadMessageDto,
} from './dto';
import { ParseJSONPipe } from '@/common/pipes/parse-json.pipe';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from '@/core/aws/s3/s3.service';
import { LoggerService } from '@/core/logger/logger.service';
import { RedisService } from '@/core/redis/redis.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { emitToRoom } from '@/common/utils/common.utils';

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

  handleConnection(client: Socket) {
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
  ) {
    const userId = client.data.user.sub;
    await this.redisService.set(`user:${userId}:online`, true, 30);

    emitToRoom({
      client,
      server: this.server,
      chatId: chatConnectionDto.chatId,
      socket: 'user:online',
      payload: { userId },
    });
  }

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) joinChatDto: ChatConnectionDto,
  ) {
    const chatName = this.chatName(joinChatDto.chatId);
    await client.join(chatName);

    emitToRoom({
      client,
      server: this.server,
      chatId: joinChatDto.chatId,
      socket: 'chat:join',
      payload: { userId: client.data.user.sub },
    });

    this.logger.log(
      `author ${client?.data?.user?.sub} connected to ${chatName}`,
    );
  }

  @SubscribeMessage('chat:leave')
  async leaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) leaveChatDto: ChatConnectionDto,
  ) {
    await client.leave(this.chatName(leaveChatDto.chatId));
    client.emit('chat:leave', { chatId: leaveChatDto.chatId });
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) sendMessageDto: SendMessageDto,
  ) {
    const { chatId, text, uniqueFileName } = sendMessageDto;
    const authorId = client.data.user.sub;
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
  }

  @SubscribeMessage('message:update')
  async updateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) updateMessageDto: UpdateMessageDto,
  ) {
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
  }

  @SubscribeMessage('message:delete')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) deleteMessageDto: DeleteMessageDto,
  ) {
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
  }

  @SubscribeMessage('message:read')
  async readMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) readMessageDto: ReadMessageDto,
  ) {
    const seenMessage = await this.chatService.readMessage({
      ...readMessageDto,
      userId: client.data.user.sub,
    });

    emitToRoom({
      client,
      server: this.server,
      chatId: readMessageDto.chatId,
      socket: 'message:seen',
      payload: seenMessage,
    });
  }

  @SubscribeMessage('poll:create')
  async createPoll(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) createPollDto: CreatePollDto,
  ) {
    const poll = await this.chatService.createPoll({
      ...createPollDto,
      userId: client.data.user.sub,
    });

    emitToRoom({
      client,
      server: this.server,
      chatId: createPollDto.chatId,
      socket: 'poll:created',
      payload: poll,
    });
  }

  @SubscribeMessage('poll:vote')
  async voteForPoll(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) voteForPollDto: VoteForPollDto,
  ) {
    const vote = await this.chatService.voteForPoll({
      ...voteForPollDto,
      userId: client.data.user.sub,
    });

    emitToRoom({
      client,
      server: this.server,
      chatId: voteForPollDto.chatId,
      socket: 'poll:receive:vote',
      payload: vote,
    });
  }
}
