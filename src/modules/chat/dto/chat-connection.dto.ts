import { IsNumber } from 'class-validator';
export class ChatConnectionDto {
  @IsNumber()
  chatId: number;
}
