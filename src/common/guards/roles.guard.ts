import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const id = request.user.id;
    if (!id) return false;

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        role: true,
      },
    });

    if (user?.role === Role.GOD) return true;
    return requiredRoles.includes(user?.role as Role);
  }
}
