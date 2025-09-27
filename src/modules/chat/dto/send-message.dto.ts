import { IsNumber, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  authorId: number;

  @IsNumber()
  chatId: number;

  @IsString()
  text: string;
}
