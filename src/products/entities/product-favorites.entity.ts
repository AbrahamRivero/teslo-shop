/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Product } from './product.entity';

@Entity({ name: 'product_favorites' })
export class ProductFavorites {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'Favorite ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '2024-03-20T12:00:00Z',
    description: 'Date when the product was added to favorites',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    type: () => User,
    description: 'User who added the product to favorites',
  })
  @ManyToOne(() => User, (user) => user.favorites, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({
    type: () => Product,
    description: 'Product that was added to favorites',
  })
  @ManyToOne(() => Product, (product) => product.favorites, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
