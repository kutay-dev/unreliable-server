import { IsString, MinLength } from 'class-validator';

export class NewPasswordsDto {
  @IsString()
  @MinLength(8)
  new: string;

  @IsString()
  newAgain: string;
}
