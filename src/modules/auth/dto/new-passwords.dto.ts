import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class NewPasswordsDto {
  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(8)
  new: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @IsNotEmpty()
  newAgain: string;
}
