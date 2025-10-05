import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UserCredentialsDto {
  @ApiProperty({ example: 'a3f4f2b1-7d3c-4b8e-9a21-2b1d8c5a9f10' })
  @IsOptional()
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'kutay' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;
}
