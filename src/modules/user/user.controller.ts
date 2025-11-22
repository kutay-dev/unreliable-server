import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
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
import { User } from 'generated/prisma/client';
import { BatchPayload } from 'generated/prisma/internal/prismaNamespace';
import { DeleteUsersBulkDto, GenerateRandomUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUser(
    @Query('username') username: string,
    @Req() req: { user: { username: string } },
  ): Promise<{ username: string; createdAt: Date }> {
    if (req.user.username !== username) {
      throw new UnauthorizedException();
    }
    return this.userService.getUser(req.user.username);
  }

  @Roles(Role.GOD)
  @Get('all')
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Roles(Role.GOD)
  @Post('generate')
  generateRandomUser(
    @Body() generations: GenerateRandomUserDto,
  ): Promise<BatchPayload> {
    return this.userService.generateRandomUser(generations);
  }

  @Roles(Role.GOD)
  @Post('delete-bulk')
  deleteUsersBulk(@Body() deleteUsersBulk: DeleteUsersBulkDto): Promise<true> {
    return this.userService.deleteUsersBulk(deleteUsersBulk);
  }
}
