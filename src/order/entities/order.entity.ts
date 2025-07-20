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

  @ApiProperty({
    example: '123 Main St, Anytown, USA',
    description: 'Shipping address details',
  })
  @Column('text')
  shippingAddress: string;

  @ApiProperty({
    example: 0,
    description: 'Discount amount',
    default: 0,
    required: false,
  })
  @Column('float', { default: 0 })
  discount?: number;

  @ApiProperty({ example: 'Credit Card', description: 'Payment method' })
  @Column('text', { default: 'cup' })
  paymentMethod: string;

  @ApiProperty({
    example: ['pending', 'cancelled', 'completed'],
    description: 'Order status',
    default: 'pending',
  })
  @Column('text', { default: 'pending' })
  orderStatus: string;

  @ApiProperty({
    example: 'ORD-001',
    description: 'Unique order number',
    uniqueItems: true,
  })
  @Column({ unique: true })
  orderNumber: string;

  @ApiProperty({
    example: 'TRK-001',
    description: 'Unique tracking number',
    uniqueItems: true,
  })
  @Column({ unique: true })
  trackingNumber: string;

  @ApiProperty({
    example: 100.50,
    description: 'Total order value',
  })
  @Column('decimal')
  totalValue: number;

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
