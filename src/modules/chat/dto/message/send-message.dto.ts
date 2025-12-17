import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  @IsNotEmpty()
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
