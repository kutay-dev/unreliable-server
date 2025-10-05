import { IsUUID } from 'class-validator';
export class ChatConnectionDto {
  @IsUUID()
  chatId: string;
}
