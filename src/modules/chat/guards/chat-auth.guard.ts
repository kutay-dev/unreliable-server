import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ChatType } from '@prisma/client';
import { ChatService } from '../chat.service';

@Injectable()
export class ChatAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userId = Number(req?.user.id);
    const chatId = Number(req?.params?.id);
    const password = req?.body.password;

    const chatType = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });

    if (chatType!.type === ChatType.PUBLIC) return true;

    const isMember = await this.chatService.validateChatMember(userId, chatId);
    if (isMember) return true;

    const chatPassword = await this.prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      select: {
        password: true,
      },
    });

    return chatPassword?.password === password;
  }
}
