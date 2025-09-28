import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerateRandomUserDto, DeleteUsersBulkDto } from './dto';
import { CommonUtils } from '@/common/utils/common.utils';
import { DB_CHUNK_SIZE } from '@/common/constants/common';
import { Role } from '@/common/enums';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
      select: {
        createdAt: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllUsers() {
    return await this.prisma.user.findMany();
  }

  async generateRandomUser(random: GenerateRandomUserDto) {
    return await this.prisma.user.createMany({
      data: Array.from({ length: random.generations }, () => ({
        username: Math.random().toString(36).substring(2, 12),
        password: `$argon2id$v=19$m=65536,t=3,p=4$${CommonUtils.generateRandomComplexString(66)}`,
      })),
    });
  }

  async deleteUsersBulk(deleteUsersBulk: DeleteUsersBulkDto) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
      where: { role: { not: Role.GOD } },
      orderBy: { createdAt: deleteUsersBulk.order || 'asc' },
      take: deleteUsersBulk.deletions,
    });

    const chunkSize = DB_CHUNK_SIZE;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize).map((user) => user.id);
      await this.prisma.user.deleteMany({
        where: { id: { in: chunk } },
      });
    }

    return true;
  }
}
