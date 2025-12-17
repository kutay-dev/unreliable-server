import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class SearchMessageDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ example: 'hell' })
  @IsString()
  @MinLength(3)
  query: string;
}
