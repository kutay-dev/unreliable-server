import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { NoProdGuard } from '@/common/guards/no-prod.guard';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from 'generated/prisma/client';
import { AuthService } from './auth.service';
import { NewPasswordsDto, UserCredentialsDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(NoProdGuard)
  @Get('init')
  async init() {
    return await this.authService.init();
  }

  @UseGuards(JwtGuard)
  @Get('protected/check')
  getUser(): true {
    return true;
  }

  @Post('login')
  async login(@Body() credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    return await this.authService.login(credentials);
  }

  @Post('signup')
  async signup(@Body() credentials: UserCredentialsDto): Promise<{
    access_token: string;
  }> {
    return await this.authService.signup(credentials);
  }

  @UseGuards(JwtGuard)
  @Post('change-password')
  async changePassword(
    @Body() passwords: NewPasswordsDto,
    @CurrentUser() user: User,
  ): Promise<{ id: string; username: string }> {
    return await this.authService.changePassword(passwords, user);
  }
}
