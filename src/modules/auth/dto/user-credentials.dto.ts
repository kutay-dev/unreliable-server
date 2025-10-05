import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UserCredentialsDto {
  @ApiProperty({ example: 42 })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty({ example: 'kutay' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;
}
