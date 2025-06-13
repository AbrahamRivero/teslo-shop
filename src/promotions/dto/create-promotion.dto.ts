/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsBoolean, IsDate, IsOptional, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionType } from '../entities/promotion.entity';
import { Product } from '../../products/entities/product.entity';

export class CreatePromotionDto {
  @ApiProperty({
    example: 'Descuento de verano',
    description: 'Título de la promoción',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Descuento especial de verano',
    description: 'Descripción de la promoción',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'PERCENTAGE_DISCOUNT',
    description: 'Tipo de promoción',
    enum: PromotionType,
  })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({
    example: 15,
    description: 'Valor de la promoción (porcentaje, monto fijo, etc)',
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    example: { minCartValue: 1000, requiredProductIds: [1, 2] },
    description: 'Condiciones para que la promoción sea aplicable',
  })
  @IsObject()
  conditions: Record<string, any>;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Fecha de inicio de la promoción',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecha de fin de la promoción',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    example: true,
    description: 'Si la promoción está activa',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: true,
    description: 'Si la promoción puede combinarse con otras',
  })
  @IsBoolean()
  @IsOptional()
  isCombinable?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Prioridad de la promoción (número menor = mayor prioridad)',
  })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Código de la promoción', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Productos aplicables', type: [Product] })
  @IsArray()
  applicableProducts: Product[];

  @ApiProperty({ description: 'Categorías aplicables', required: false })
  @IsArray()
  @IsOptional()
  applicableCategories?: string[];

  @ApiProperty({ description: 'Monto mínimo de compra', required: false })
  @IsNumber()
  @IsOptional()
  minimumPurchaseAmount?: number;

  @ApiProperty({ description: 'Número máximo de usos', required: false })
  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ description: 'Número de usos por usuario', required: false })
  @IsNumber()
  @IsOptional()
  usesPerUser?: number;
} 