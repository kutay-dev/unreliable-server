import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class ConfigDto {
  @ApiProperty({ example: 'semantic_search_available' })
  @IsString()
  config: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    example: { enabled_countries: ['US'], min_age: 18 },
  })
  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Is semantic search available globally' })
  @IsOptional()
  @IsString()
  description?: string;
}
