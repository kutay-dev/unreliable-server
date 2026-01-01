import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ example: '686fd61d-6090-487a-97cb-b9255e88682b' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
