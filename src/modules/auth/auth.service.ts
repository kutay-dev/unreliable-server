import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserCredentialsDto } from './dto/user-credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(credentials: UserCredentialsDto) {
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

  async signup(credentials: UserCredentialsDto) {
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new UnauthorizedException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signToken(userId: number, username: string) {
    const payload = {
      sub: userId,
      username,
    };
    const secret = this.config.get('JWT_SECRET') || 'super_secret';
    const expiresIn = this.config.get('JWT_EXPIRES_IN') || '30d';
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn,
      secret,
    });

    return { access_token };
  }
}
