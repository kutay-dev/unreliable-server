import { ChatType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
export class CreateChatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(ChatType)
  type?: ChatType;

  @IsOptional()
  @IsString()
  password?: string;
}
