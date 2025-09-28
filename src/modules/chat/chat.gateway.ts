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

@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token: string = client.handshake.auth?.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @WebSocketServer() server: Server;

  private chatName = (chatId: number) => `chat:${chatId}`;

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
    client.broadcast
      .to(this.chatName(sendMessageDto.chatId))
      .emit('message:receive', {
        authorId: client.data.user.sub,
        text: sendMessageDto.text,
      });

    await this.chatService.sendMessage({
      authorId: client.data.user.sub,
      ...sendMessageDto,
    });
  }
}
