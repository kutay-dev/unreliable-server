import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
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
    const userId: string = req?.user.id;
    const chatId: string = req?.params?.id;
    const password = req?.body.password;

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true, password: true },
    });
    if (!chat) throw new BadRequestException("Chat doesn't exist");

    if (chat.type === ChatType.PUBLIC) return true;

    const isMember = await this.chatService.validateChatMember(userId, chatId);
    if (isMember) return true;

    const passwordMatches = chat.password === password;

    if (!passwordMatches) throw new UnauthorizedException();
    return true;
  }
}
