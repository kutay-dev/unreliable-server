import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatConnectionDto, SendMessageDto } from './dto';
import { ParseJSONPipe } from '@/common/pipes/parse-json.pipe';

@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway {
  constructor(private chatService: ChatService) {}
  @WebSocketServer() server: Server;

  private chatName = (chatId: number) => `chat://${chatId}`;

  @SubscribeMessage('chat:join')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody(ParseJSONPipe) joinChatDto: ChatConnectionDto,
  ) {
    const chatName = this.chatName(joinChatDto.chatId);
    await client.join(chatName);
    this.server.to(chatName).emit('chat:join', { userId: joinChatDto.userId });
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
    @MessageBody(ParseJSONPipe) sendMessageDto: SendMessageDto,
  ) {
    await this.chatService.sendMessage(sendMessageDto);
    this.server
      .to(this.chatName(sendMessageDto.chatId))
      .emit('message:receive', {
        authorId: sendMessageDto.authorId,
        text: sendMessageDto.text,
      });
  }
}
