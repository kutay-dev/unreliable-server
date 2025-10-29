import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class GenerateMessageDto {
  @ApiProperty({ example: '5ae26726-cd95-4899-9de9-d2ee010110bf' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  generations: number;
}
