import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums';
import { JwtGuard } from '@/common/guards/jwt.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppConfig } from 'generated/prisma/client';
import { AppConfigService } from './app-config.service';
import { ConfigDto } from './dto';

@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.GOD)
@Controller('internal/app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get('get-all')
  getAllConfigs(): Promise<AppConfig[]> {
    return this.appConfigService.getAllConfigs();
  }

  @Get('get/:config')
  getConfig(@Param('config') config: string): Promise<AppConfig | null> {
    return this.appConfigService.getConfig(config);
  }

  @Post('create')
  createConfig(@Body() createConfigDto: ConfigDto): Promise<AppConfig | void> {
    return this.appConfigService.createConfig(createConfigDto);
  }

  @Patch('update')
  updateConfig(@Body() updateConfigDto: ConfigDto): Promise<AppConfig | void> {
    return this.appConfigService.updateConfig(updateConfigDto);
  }

  @Delete('delete/:config')
  deleteConfig(@Param('config') config: string): Promise<AppConfig | void> {
    return this.appConfigService.deleteConfig(config);
  }
}
