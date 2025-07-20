/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/products/entities';

@Entity({ name: 'order_items' })
export class OrderItem {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'OrderItem ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Order, description: 'Associated order' })
  @ManyToOne(() => Order, (order) => order.orderItems)
  order: Order;

  @ApiProperty({ type: () => Product, description: 'Associated product' })
  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @ApiProperty({
    example: 1,
    description: 'Quantity of product in this order item',
  })
  @Column('int')
  quantity: number;

  @ApiProperty({
    example: 'XL',
    description: 'Size of product in this order item',
    nullable: true,
    required: false,
  })
  @Column('string', { nullable: true })
  size?: string;
}
