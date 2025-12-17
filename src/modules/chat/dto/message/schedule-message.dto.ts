import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class ScheduleMessageDto extends SendMessageDto {
  @ApiProperty({ example: '2025-10-26T19:36:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  schedule: string;
}
