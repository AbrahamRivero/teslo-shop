/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    type: 'string',
    example: '123 Main St, Anytown, USA',
    description: 'Shipping address details',
  })
  @IsString()
  @MinLength(1)
  shippingAddress: string;

  @ApiProperty({
    example: 0,
    description: 'Discount amount',
    default: 0,
    required: false,
    nullable: true,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  discount?: number;

  @ApiProperty({
    example: 0,
    description: 'Total order amount',
    default: 0,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  totalValue: number;

  @ApiProperty({
    type: 'string',
    example: 'Credit Card',
    description: 'Payment method',
    nullable: false,
    required: false,
  })
  @IsString()
  @IsIn(['usd', 'euro', 'cup', 'card'])
  @IsOptional()
  paymentMethod_: string;

  @ApiProperty({
    example: ['pending', 'cancelled', 'completed'],
    description: 'Order status',
    default: 'pending',
  })
  orderStatus: string;

  @ApiProperty({
    type: 'array',
    example: [{ quantity: 1, product: '2359aaeb-c8ec-451c-b618-a1446c305057' }],
    description: 'List of order items',
    nullable: false,
    required: true,
  })
  @IsArray()
  orderItems: { quantity: number; product: string; size?: string }[];
}
