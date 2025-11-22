import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChatType } from 'generated/prisma/client';

export class CreateChatDto {
  @ApiProperty({ example: 'Family chat' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: ChatType.PRIVATE })
  @IsOptional()
  @IsEnum(ChatType)
  type?: ChatType;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;
}
