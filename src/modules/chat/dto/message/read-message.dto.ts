import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ReadMessageDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  @IsNotEmpty()
  lastSeenMessageId: string;
}
