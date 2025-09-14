import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class DeleteUsersBulkDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  deletions: number;

  @IsNotEmpty()
  @IsString()
  order: 'asc' | 'desc';
}
