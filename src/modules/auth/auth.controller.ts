import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserCredentialsDto, NewPasswordsDto } from './dto';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtGuard)
  @Get('protected/check')
  getUser() {
    return true;
  }

  @Post('login')
  async login(@Body() credentials: UserCredentialsDto) {
    return await this.authService.login(credentials);
  }

  @Post('signup')
  async signup(@Body() credentials: UserCredentialsDto) {
    return await this.authService.signup(credentials);
  }

  @UseGuards(JwtGuard)
  @Post('change-password')
  async changePassword(
    @Body() passwords: NewPasswordsDto,
    @CurrentUser() user: User,
  ) {
    return await this.authService.changePassword(passwords, user);
  }
}
