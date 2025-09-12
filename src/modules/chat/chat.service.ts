import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { SendMessageDto } from './dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  getChat() {
    return this.prisma.chat.findMany({});
  }

  sendMessage(dto: SendMessageDto) {
    return this.prisma.chat.create({
      data: {
        username: dto.username,
        text: dto.text,
      },
    });
  }
}
