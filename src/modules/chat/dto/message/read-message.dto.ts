import { ApiProperty } from '@nestjs/swagger';
import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { IsUUID } from 'class-validator';

export class ReadMessageDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  chatId: string;

  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  lastSeenMessageId: string;
}
