/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  IsString,
  Length,
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
    example: '52788965',
    description: 'Receiver phone',
    nullable: true,
    required: false,
  })
  @IsString()
  @Length(8, 8, { message: 'El teléfono debe tener 8 dígitos' })
  phone: string;

  @ApiProperty({
    example: 'Varadero',
    description: 'Receiver city',
  })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'La Habana',
    description: 'Receiver province',
  })
  @IsString()
  @IsIn(['matanzas', 'habana'], {
    message: 'Solo se realizan envíos a Matanzas y La Habana',
  })
  province: string;

  @ApiProperty({
    example: 0,
    description: 'Discount amount',
    default: 0,
    required: false,
    nullable: true,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    example: 0,
    description: 'Subtotal order amount',
    default: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    example: 0,
    description: 'Shipping order amount',
    default: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  shipping: number;

  @ApiProperty({
    example: 0,
    description: 'Total order amount',
    default: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    example: 'Deben tocar varias veces la puerta...',
    description: 'Notes details',
  })
  @IsString()
  @Length(0, 500, { message: 'La nota no debe contener más de 500 caracteres' })
  notes?: string;

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
  paymentMethod: string;

  @ApiProperty({
    example: 'pending',
    description: 'Order status',
    default: 'pending',
  })
  @IsIn(['pending', 'cancelled', 'completed', 'confirmed', 'shipped'], {
    message:
      'El estado del pedido debe ser uno de los siguientes: pending, cancelled, completed,confirmed,shipped',
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
