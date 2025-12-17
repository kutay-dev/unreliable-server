import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendAIMessageDto {
  @ApiProperty({ example: 'hello there' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
