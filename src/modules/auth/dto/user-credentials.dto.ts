import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UserCredentialsDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
