/* eslint-disable prettier/prettier */

import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Product } from 'src/products/entities';
import { Review } from 'src/reviews/entities/review.entity';
import { Order } from 'src/order/entities/order.entity';
import { ProductFavorites } from 'src/products/entities/product-favorites.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'User ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'test@test.com',
    description: 'User email',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    nullable: false,
  })
  @Column('text', { select: false })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    nullable: false,
  })
  @Column('text')
  fullName: string;

  @ApiProperty({
    example: true,
    description: 'User active status',
    default: true,
  })
  @Column('bool', { default: true })
  isActive: boolean;

  @ApiProperty({
    example: ['user', 'admin', 'super-user'],
    description: 'User roles',
    default: ['user'],
    type: [String],
  })
  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @ApiProperty({
    example: ['product1', 'product2'],
    description: 'User products',
  })
  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @ApiProperty({
    example: ['review1', 'review2'],
    description: 'User reviews',
  })
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @ApiProperty({
    example: ['order1', 'order2'],
    description: 'User orders',
  })
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @ApiProperty({
    example: ['favorite1', 'favorite2'],
    description: 'User favorite products',
  })
  @OneToMany(() => ProductFavorites, (favorite) => favorite.user)
  favorites: ProductFavorites[];

  @ApiProperty({
    example: 'refresh_token_example',
    description: 'Refresh token actual del usuario',
    required: false,
  })
  @Column('text', { nullable: true })
  refreshToken?: string;

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}

export class UserWithOutPassword extends OmitType(User, [
  'password',
] as const) {}
