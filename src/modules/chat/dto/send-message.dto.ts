import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsNumber()
  authorId: number;

  @IsNumber()
  chatId: number;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  uniqueFileName?: string;
}
