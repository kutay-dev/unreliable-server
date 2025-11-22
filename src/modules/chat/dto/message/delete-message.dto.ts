import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMessageDto {
  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  messageId: string;
}
