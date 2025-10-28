import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, MinDate } from 'class-validator';
import { SendMessageDto } from '.';

export class ScheduleMessageDto extends SendMessageDto {
  @ApiProperty({ example: '2025-10-26T19:36:00.000Z' })
  @IsDateString()
  @MinDate(new Date())
  schedule: string;
}
