import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserCredentialsDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
