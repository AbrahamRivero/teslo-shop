/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';
import { Product } from '../products/entities/product.entity';
import { PercentageDiscountStrategy } from './strategies/impl/percentage-discount.strategy';
import { FreeShippingStrategy } from './strategies/impl/free-shipping.strategy';
import { BogoStrategy } from './strategies/impl/bogo.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion, Product]),
  ],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    PercentageDiscountStrategy,
    FreeShippingStrategy,
    BogoStrategy,
  ],
  exports: [PromotionsService],
})
export class PromotionsModule {} 