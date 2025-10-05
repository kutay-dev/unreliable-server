import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DeleteUsersBulkDto {
  @ApiProperty({ example: 99 })
  @IsInt()
  @Min(1)
  deletions: number;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  order: 'asc' | 'desc';
}
