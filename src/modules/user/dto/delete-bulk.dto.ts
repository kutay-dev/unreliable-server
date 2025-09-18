import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DeleteUsersBulkDto {
  @IsInt()
  @Min(1)
  deletions: number;

  @IsOptional()
  @IsString()
  order: 'asc' | 'desc';
}
