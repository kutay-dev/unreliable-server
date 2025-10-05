import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class NewPasswordsDto {
  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(8)
  new: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  newAgain: string;
}
