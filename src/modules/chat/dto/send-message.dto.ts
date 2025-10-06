import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SendMessageType } from '@/common/enums';
import { IsULID } from '@/common/decorators/is-ulid.decorator';

export class SendMessageDto {
  @ApiPropertyOptional({ example: SendMessageType.POST })
  @IsOptional()
  @IsEnum(SendMessageType)
  type?: SendMessageType;

  @ApiPropertyOptional({ example: '5ae26726-cd95-4899-9de9-d2ee010110bf' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  chatId?: string;

  @ApiPropertyOptional({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsOptional()
  @IsULID()
  messageId?: string;

  @ApiPropertyOptional({ example: 'Hello world' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'image.png' })
  @IsOptional()
  @IsString()
  uniqueFileName?: string;
}
