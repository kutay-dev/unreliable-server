import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class SendAIMessageDto {
  @ApiProperty({ example: 'hello there' })
  @IsString()
  content: string;
}
