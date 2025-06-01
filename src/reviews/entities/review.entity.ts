/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/auth/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity({ name: 'reviews' })
export class Review {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'Review ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'This is a review',
    description: 'Review comment',
  })
  @Column('text')
  comment: string;

  @ApiProperty({
    example: 4,
    description: 'Review rating',
    required: true,
  })
  @Column('int')
  rating: number;

  @ApiProperty({
    example: '2024-03-20T15:30:00Z',
    description: 'Review creation date',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
