import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserCredentialsDto } from './dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':username')
  getUser(@Param('username') username: string) {
    return this.userService.getUser(username);
  }

  @Post('login')
  async login(@Body() dto: UserCredentialsDto) {
    await this.userService.login(dto);
  }

  @Post('signup')
  async create(@Body() dto: UserCredentialsDto) {
    await this.userService.signup(dto);
  }
}
