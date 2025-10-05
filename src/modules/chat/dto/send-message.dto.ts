import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsNumber()
  authorId: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  chatId: number;

  @ApiPropertyOptional({ example: 'Hello world' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'image.png' })
  @IsOptional()
  @IsString()
  uniqueFileName?: string;
}
