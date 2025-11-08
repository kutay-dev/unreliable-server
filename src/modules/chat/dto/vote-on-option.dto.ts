import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class VoteOnOptionDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ example: '1ce5b75b-6de2-40d5-bac2-1b6f0256a531' })
  @IsUUID()
  optionId: string;

  userId: string;
}
