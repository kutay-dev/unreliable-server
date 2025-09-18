import { IsNotEmpty, IsString } from 'class-validator';

export class NewPasswordsDto {
  @IsString()
  @IsNotEmpty()
  new: string;

  @IsString()
  @IsNotEmpty()
  newAgain: string;
}
