import { Role } from '@/common/enums';
import { LoggerService } from '@/core/logger/logger.service';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ChatService } from '@/modules/chat/chat.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { ChatType, User } from 'generated/prisma/client';
import { NewPasswordsDto, UserCredentialsDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setModuleName(AuthService.name);
  }

  async init(): Promise<{
    access_token: string;
    god_id: string;
    paris_id: string;
    message_id: string;
  }> {
    try {
      this.logger.log('Initializing God System');
      const { access_token } = await this.signup({
        username: 'god',
        password: 'god12345',
      });
      const god = await this.prisma.user.findUnique({
        where: { username: 'god' },
      });
      await this.prisma.user.update({
        where: { id: god!.id },
        data: { role: Role.GOD },
      });
      const paris = await this.chatService.createChat({
        name: 'Paris',
        type: ChatType.PUBLIC,
      });
      await this.chatService.insertMember(god!.id, paris.id!);
      const data = await this.chatService.sendMessage({
        chatId: paris.id!,
        authorId: god!.id,
        text: 'In the beginning God created the heaven and the earth',
      });

      this.logger.log('God System initialized successfully');
      return {
        access_token,
        god_id: data.authorId,
        paris_id: data.chatId,
        message_id: data.id,
      };
    } catch (error) {
      this.logger.error(
        'Failed to initialize God System',
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async login(credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          username: credentials.username,
        },
      });

      if (!user) {
        this.logger.warn(
          `Login attempt for non-existent user: ${credentials.username}`,
        );
        throw new NotFoundException('User not found');
      }

      const passwordMatches = await argon.verify(
        user.password,
        credentials.password,
      );
      if (!passwordMatches) {
        this.logger.warn(`Invalid password for user: ${credentials.username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`User logged in successfully: ${credentials.username}`);
      return this.signToken(user.id, user.username);
    } catch (error) {
      if (
        !(error instanceof NotFoundException) &&
        !(error instanceof UnauthorizedException)
      ) {
        this.logger.error(
          `Login error for user: ${credentials.username}`,
          (error as Error)?.stack,
        );
      }
      throw error;
    }
  }

  async signup(credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    try {
      const hash = await argon.hash(credentials.password);

      const user = await this.prisma.user.create({
        data: {
          username: credentials.username,
          password: hash,
        },
      });

      this.logger.log(`New user signed up: ${credentials.username}`);
      return this.signToken(user.id, user.username);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Credentials taken');
      }
      this.logger.error(
        `Signup error for user: ${credentials.username}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async changePassword(
    passwords: NewPasswordsDto,
    user: User,
  ): Promise<{ id: string; username: string }> {
    try {
      if (passwords.new !== passwords.newAgain) {
        this.logger.warn(
          `Password change failed - passwords don't match for user: ${user.username}`,
        );
        throw new BadRequestException("Passwords don't match");
      }

      const passwordMatches = await argon.verify(user.password, passwords.new);
      if (passwordMatches) {
        throw new BadRequestException('New password must be different');
      }

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
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        this.logger.error(
          `Password change error for user: ${user.username}`,
          (error as Error)?.stack,
        );
      }
      throw error;
    }
  }

  async signToken(
    userId: string,
    username: string,
  ): Promise<{
    access_token: string;
  }> {
    try {
      const payload = {
        sub: userId,
        username,
      };

      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
    } catch (error) {
      this.logger.error(
        `Token signing failed for user: ${username}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }
}
