import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(private chatService: ChatService) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('sendMessage')
  async sendMessage(client: Socket, data: { username: string; text: string }) {
    this.server.emit('sendMessage', {
      username: data.username,
      text: data.text,
      createdAt: new Date(),
    });

    await this.chatService.sendMessage(data.username, data.text);
  }
}
