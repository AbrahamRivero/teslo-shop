/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateProductFavoriteDto {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'Product ID to add to favorites',
  })
  @IsUUID()
  productId: string;
} 