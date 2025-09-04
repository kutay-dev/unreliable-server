import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  getChat() {
    return this.prisma.chat.findMany({});
  }

  sendMessage(username: string, text: string) {
    return this.prisma.chat.create({
      data: {
        username,
        text,
      },
    });
  }
}
