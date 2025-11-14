import { ApiProperty } from '@nestjs/swagger';
import { IsULID } from '@/common/decorators/is-ulid.decorator';

export class DeleteMessageDto {
  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  messageId: string;
}
