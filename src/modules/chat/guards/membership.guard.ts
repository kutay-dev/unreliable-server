import { LoggerService } from '@/core/logger/logger.service';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatType } from 'generated/prisma/enums';
import { Socket } from 'socket.io';
import { ChatService } from '../chat.service';

type AuthedRequest = Request & { user?: { id?: string } };

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private readonly logger: LoggerService,
    private readonly chatService: ChatService,
  ) {
    this.logger.setModuleName(MembershipGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<AuthedRequest>();
      const userId: string | undefined = req?.user?.id;
      const chatId: string | undefined =
        req?.params?.chatId ??
        req?.params?.id ??
        req?.body?.chatId ??
        req?.query?.chatId;
      await this.handleMembershipValidation(userId, chatId);
    }

    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<Socket>();
      const data = this.getWsPayload(context.switchToWs().getData());
      const userId: string | undefined =
        client?.data?.user?.sub ?? client?.data?.user?.id;
      const chatId: string | undefined =
        data?.chatId ??
        client?.handshake?.query?.chatId?.toString() ??
        client?.handshake?.auth?.chatId?.toString();
      await this.handleMembershipValidation(userId, chatId);
    }

    return true;
  }

  private getWsPayload(data: unknown): { chatId?: string } | undefined {
    if (!data) return undefined;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as { chatId?: string };
      } catch {
        return undefined;
      }
    }
    if (typeof data === 'object') {
      return data as { chatId?: string };
    }
    return undefined;
  }

  private async handleMembershipValidation(
    userId?: string,
    chatId?: string,
  ): Promise<boolean> {
    if (!userId || !chatId) {
      throw new BadRequestException('userId and chatId is required');
    }
    const membership = await this.chatService.validateMembership(
      userId,
      chatId,
    );
    if (!membership) return false;
    if (membership.type === ChatType.PUBLIC || membership.id) {
      return true;
    }
    this.logger.error(`User ${userId} is not a member of the chat ${chatId}`);
    throw new UnauthorizedException('Not a member of this chat');
  }
}
