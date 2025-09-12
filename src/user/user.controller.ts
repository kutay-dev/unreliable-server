import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserCredentialsDto } from './dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
  async login(@Body() dto: UserCredentialsDto) {
    await this.userService.login(dto);
  }

  @Post('signup')
  async create(@Body() dto: UserCredentialsDto) {
    await this.userService.signup(dto);
  }
}
