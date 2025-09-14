import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUser(
    @Query('username') username: string,
    @Req() req: { user: { username: string } },
  ) {
    if (req.user.username !== username) {
      throw new UnauthorizedException();
    }
    return this.userService.getUser(req.user.username);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.GOD)
  @Get('all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
