import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  messageId: string;

  @ApiProperty({ example: 'Updated text' })
  @IsString()
  text: string;
}
