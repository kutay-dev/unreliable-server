import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(private chatService: ChatService) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('sendMessage')
  async sendMessage(client: Socket, dto: SendMessageDto) {
    this.server.emit('sendMessage', {
      username: dto.username,
      text: dto.text,
      createdAt: new Date(),
    });

    await this.chatService.sendMessage(dto);
  }
}
