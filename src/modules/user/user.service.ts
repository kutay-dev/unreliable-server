import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserCredentialsDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

  async login(dto: UserCredentialsDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (user?.username === dto.username && user?.password === dto.password)
      return user;

    throw new UnauthorizedException('Invalid credentials');
  }

  signup(dto: UserCredentialsDto) {
    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: dto.password,
      },
    });
  }
}
