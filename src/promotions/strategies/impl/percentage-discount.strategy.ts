/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { IPromotionStrategy, PromotionContext, AppliedPromotion } from '../promotion.strategy.interface';
import { Promotion, PromotionType } from '../../entities/promotion.entity';

@Injectable()
export class PercentageDiscountStrategy implements IPromotionStrategy {
  isApplicable(context: PromotionContext, promotion: Promotion): boolean {
    if (promotion.type !== PromotionType.PERCENTAGE_DISCOUNT) {
      return false;
    }

    const { minCartValue = 0, requiredProductIds = [] } = promotion.conditions;

    // Verificar valor mínimo del carrito
    if (context.subtotal < minCartValue) {
      return false;
    }

    // Verificar productos requeridos si existen
    if (requiredProductIds.length > 0) {
      const hasRequiredProducts = context.items.some(item =>
        requiredProductIds.includes(item.product.id)
      );
      if (!hasRequiredProducts) {
        return false;
      }
    }

    return true;
  }

  apply(context: PromotionContext, promotion: Promotion): AppliedPromotion {
    const discountAmount = (context.subtotal * promotion.value) / 100;

    return {
      promotionId: promotion.id,
      title: promotion.title,
      type: promotion.type,
      discountAmount,
      description: `${promotion.value}% de descuento`,
      affectedItems: context.items,
    };
  }
} 