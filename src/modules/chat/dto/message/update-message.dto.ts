import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsULID()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ example: 'Updated text' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
