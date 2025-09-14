import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get(':username')
  getUser(
    @Param('username') username: string,
    @Req() req: { user: { username: string } },
  ) {
    if (req.user.username !== username) {
      throw new ForbiddenException();
    }
    return this.userService.getUser(req.user.username);
  }
}
