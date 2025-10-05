import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UserCredentialsDto {
  @ApiProperty({ example: '5ae26726-cd95-4899-9de9-d2ee010110bf' })
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
