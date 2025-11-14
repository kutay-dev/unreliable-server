import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsULID } from '@/common/decorators/is-ulid.decorator';

export class UpdateMessageDto {
  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  messageId: string;

  @ApiProperty({ example: 'Updated text' })
  @IsString()
  text: string;
}
