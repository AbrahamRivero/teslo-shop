/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  MinLength,
  IsPositive,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 'This is a review',
    description: 'Review comment',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment: string;

  @ApiProperty({
    example: 4,
    description: 'Review rating',
    required: true,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del producto asociado a la reseña',
    required: true,
  })
  @IsString()
  productId: string;
}
