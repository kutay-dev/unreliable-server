import { IsULID } from '@/common/decorators/is-ulid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsUUID, Max } from 'class-validator';

export class GetMessagesDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @ApiProperty()
  @IsUUID()
  chatId: string;

  @ApiPropertyOptional({ example: '01K6TGX42XQ6RK0M3QEXZ0P36Q' })
  @IsOptional()
  @IsULID()
  cursor?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(250)
  limit?: number;
}
