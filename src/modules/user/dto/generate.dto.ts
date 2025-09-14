import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class GenerateRandomUserDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  generations: number;
}
