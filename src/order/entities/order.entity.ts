/* eslint-disable prettier/prettier */

import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'Order ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 0, description: 'Subtotal amount', default: 0 })
  @Column('float', { default: 0 })
  subTotal: number;

  @ApiProperty({ example: 0, description: 'Discount amount', default: 0 })
  @Column('float', { default: 0 })
  discount: number;

  @ApiProperty({ example: 0, description: 'Total amount', default: 0 })
  @Column('float', { default: 0 })
  total: number;

  @ApiProperty({
    example: '123 Main St, Anytown, USA',
    description: 'Shipping address details',
  })
  @Column('text')
  shippingAddress: string;

  @ApiProperty({ example: 'Credit Card', description: 'Payment method' })
  @Column('text', { default: 'cup' })
  paymentMethod: string;

  @ApiProperty({
    example: false,
    description: 'Order payment status',
    default: false,
  })
  @Column('bool', { default: false })
  isPaid: boolean;

  @ApiProperty({
    description: 'Customer who placed the order',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.orders, { eager: true })
  user: User;

  @ApiProperty({
    type: () => [OrderItem],
    description: 'List of items in the order',
  })
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  orderItems: OrderItem[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Order creation timestamp',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'Order update timestamp',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
