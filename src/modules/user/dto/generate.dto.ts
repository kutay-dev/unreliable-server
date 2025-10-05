import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class GenerateRandomUserDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  generations: number;
}
