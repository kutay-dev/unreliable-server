import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'a3f4f2b1-7d3c-4b8e-9a21-2b1d8c5a9f10' })
  @IsOptional()
  @IsUUID()
  authorId: string;

  @ApiProperty({ example: 'b6c2f0d4-5e8a-4c1b-9d7f-3a2b1c4d5e6f' })
  @IsUUID()
  chatId: string;

  @ApiPropertyOptional({ example: 'Hello world' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'image.png' })
  @IsOptional()
  @IsString()
  uniqueFileName?: string;
}
