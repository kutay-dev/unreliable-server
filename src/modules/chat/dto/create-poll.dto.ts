import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePollDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ example: 'Lunch?' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: ['Pizza', 'Burger', 'Sushi'] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];
}
