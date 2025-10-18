import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';
import { GenerateRandomUserDto, DeleteUsersBulkDto } from './dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Roles(Role.GOD)
  @Get('all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Roles(Role.GOD)
  @Post('generate')
  generateRandomUser(@Body() generations: GenerateRandomUserDto) {
    return this.userService.generateRandomUser(generations);
  }

  @Roles(Role.GOD)
  @Post('delete-bulk')
  deleteUsersBulk(@Body() deleteUsersBulk: DeleteUsersBulkDto) {
    return this.userService.deleteUsersBulk(deleteUsersBulk);
  }
}
