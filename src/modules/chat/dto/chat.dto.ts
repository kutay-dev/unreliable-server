import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  text: string;
}
