import { IsNotEmpty, IsString } from 'class-validator';

export class UserCredentialsDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
