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
import { ChatConnectionDto, SendMessageDto } from './dto';
import { ParseJSONPipe } from '@/common/pipes/parse-json.pipe';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from '@/common/aws/s3/s3.service';
import { LoggerService } from '@/core/logger/logger.service';

@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(ChatGateway.name);
  }

  handleConnection(client: Socket) {
    try {
      const token: string = client.handshake.auth?.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch {
      this.logger.warn(`user ${client?.data?.user?.sub} couldn't connect`);
      client.disconnect();
    }
  }

  @WebSocketServer() server: Server;

  private chatName = (chatId: string) => `chat:${chatId}`;

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) joinChatDto: ChatConnectionDto,
  ) {
    const chatName = this.chatName(joinChatDto.chatId);
    await client.join(chatName);
    this.server
      .to(chatName)
      .emit('chat:join', { userId: client.data.user.sub });
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
    const imageUrl: string | null = sendMessageDto.uniqueFileName
      ? await this.s3Service.presignDownloadUrl(sendMessageDto.uniqueFileName)
      : null;

    client.broadcast
      .to(this.chatName(sendMessageDto.chatId))
      .emit('message:receive', {
        authorId: client.data.user.sub,
        text: sendMessageDto.text,
        imageUrl,
      });

    await this.chatService.sendMessage({
      chatId: sendMessageDto.chatId,
      authorId: client.data.user.sub,
      text: sendMessageDto.text,
      uniqueFileName: sendMessageDto.uniqueFileName,
    });
  }
}
