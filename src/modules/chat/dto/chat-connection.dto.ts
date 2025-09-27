import { IsNumber } from 'class-validator';
export class ChatConnectionDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  chatId: number;
}
