import { PrismaService } from '@/core/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { User } from 'generated/prisma/client';
import { NewPasswordsDto, UserCredentialsDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: {
        username: credentials.username,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const passwordMatches = await argon.verify(
      user.password,
      credentials.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.username);
  }

  async signup(credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    const hash = await argon.hash(credentials.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          username: credentials.username,
          password: hash,
        },
      });
      return this.signToken(user.id, user.username);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Credentials taken');
      }
      throw error;
    }
  }

  async changePassword(
    passwords: NewPasswordsDto,
    user: User,
  ): Promise<{ id: string; username: string }> {
    if (passwords.new !== passwords.newAgain)
      throw new BadRequestException("Passwords don't match");

    const passwordMatches = await argon.verify(user.password, passwords.new);
    if (passwordMatches)
      throw new BadRequestException('New password must be different');

    const hash = await argon.hash(passwords.new);

    return await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hash,
      },
      select: {
        id: true,
        username: true,
      },
    });
  }

  async signToken(
    userId: string,
    username: string,
  ): Promise<{
    access_token: string;
  }> {
    const payload = {
      sub: userId,
      username,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
}
