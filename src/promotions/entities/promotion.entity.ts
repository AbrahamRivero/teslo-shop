/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';

export enum PromotionType {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_DISCOUNT = 'FIXED_DISCOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BOGO = 'BOGO',
}

@Entity('promotions')
export class Promotion {
  @ApiProperty({ description: 'ID único de la promoción' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Título de la promoción' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Descripción de la promoción' })
  @Column()
  description: string;

  @ApiProperty({ description: 'Tipo de promoción', enum: PromotionType })
  @Column({
    type: 'enum',
    enum: PromotionType,
    default: PromotionType.PERCENTAGE_DISCOUNT,
  })
  type: PromotionType;

  @ApiProperty({ description: 'Valor del descuento o beneficio' })
  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @ApiProperty({ description: 'Fecha de inicio de la promoción' })
  @Column()
  startDate: Date;

  @ApiProperty({ description: 'Fecha de fin de la promoción' })
  @Column()
  endDate: Date;

  @ApiProperty({ description: 'Código de la promoción', required: false })
  @Column({ nullable: true })
  code?: string;

  @ApiProperty({ description: 'Productos aplicables' })
  @ManyToMany(() => Product)
  @JoinTable({
    name: 'promotion_products',
    joinColumn: { name: 'promotion_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  applicableProducts: Product[];

  @ApiProperty({ description: 'Categorías aplicables', required: false })
  @Column('simple-array', { nullable: true })
  applicableCategories?: string[];

  @ApiProperty({ description: 'Monto mínimo de compra', required: false })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minimumPurchaseAmount?: number;

  @ApiProperty({ description: 'Número máximo de usos', required: false })
  @Column({ nullable: true })
  maxUses?: number;

  @ApiProperty({ description: 'Número de usos por usuario', required: false })
  @Column({ nullable: true })
  usesPerUser?: number;

  @ApiProperty({ description: 'Prioridad de la promoción', required: false })
  @Column({ default: 0 })
  priority: number;

  @ApiProperty({ description: 'Indica si la promoción está activa' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Indica si la promoción puede combinarse con otras' })
  @Column({ default: true })
  isCombinable: boolean;

  @ApiProperty({ description: 'Condiciones adicionales de la promoción' })
  @Column('jsonb', { nullable: true })
  conditions: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  @UpdateDateColumn()
  updatedAt: Date;
} 