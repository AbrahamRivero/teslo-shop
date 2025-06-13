/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { ProductFavorites } from './product-favorites.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
    example: '2359aaeb-c8ec-451c-b618-a1446c305057',
    description: 'Product ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'T-shirt',
    description: 'Product title',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  title: string;

  @ApiProperty({ example: 0, description: 'Product price' })
  @Column('float', { default: 0 })
  price: number;

  @ApiProperty({
    example: 'This is a product description',
    description: 'Product description',
    default: null,
  })
  @Column('text', { nullable: true })
  description: string;

  @ApiProperty({
    example: 't-shirt',
    description: 'Product slug',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  slug: string;

  @ApiProperty({ example: 0, description: 'Product stock', default: 0 })
  @Column('int', { default: 0 })
  stock: number;

  @ApiProperty({ example: ['S', 'M', 'L'], description: 'Product sizes' })
  @Column('text', { array: true })
  sizes: string[];

  @ApiProperty({ example: 'men', description: 'Product gender' })
  @Column('text')
  gender: string;

  @ApiProperty({ example: ['tag1', 'tag2'], description: 'Product tags' })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ManyToOne(() => User, (user) => user.products, { eager: true })
  user: User;

  @ApiProperty({
    example: ['tag1.jpg', 'tag2.jpg'],
    description: 'Product images',
  })
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @ApiProperty({
    example: ['review1', 'review2'],
    description: 'Product reviews',
  })
  @OneToMany(() => Review, (review) => review.product, {
    cascade: true,
    eager: true,
  })
  reviews?: Review[];

  @ApiProperty({
    example: ['favorite1', 'favorite2'],
    description: 'Product favorites',
  })
  @OneToMany(() => ProductFavorites, (favorite) => favorite.product)
  favorites?: ProductFavorites[];

  @ApiProperty({
    example: ['relatedProduct1', 'relatedProduct2'],
    description: 'Productos relacionados',
  })
  @ManyToMany(() => Product)
  @JoinTable({
    name: 'product_related',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'related_product_id', referencedColumnName: 'id' },
  })
  relatedProducts: Product[];

  @BeforeInsert()
  @BeforeUpdate()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
