import { IsInt, Min } from 'class-validator';

export class GenerateRandomUserDto {
  @IsInt()
  @Min(1)
  generations: number;
}
