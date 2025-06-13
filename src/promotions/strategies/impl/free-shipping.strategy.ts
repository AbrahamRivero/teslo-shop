/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { IPromotionStrategy, PromotionContext, AppliedPromotion } from '../promotion.strategy.interface';
import { Promotion, PromotionType } from '../../entities/promotion.entity';

@Injectable()
export class FreeShippingStrategy implements IPromotionStrategy {
  isApplicable(context: PromotionContext, promotion: Promotion): boolean {
    if (promotion.type !== PromotionType.FREE_SHIPPING) {
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
    // Asumimos que el costo de envío está en las condiciones
    const { shippingCost = 0 } = promotion.conditions;

    return {
      promotionId: promotion.id,
      title: promotion.title,
      type: promotion.type,
      discountAmount: shippingCost,
      description: 'Envío gratis',
      affectedItems: context.items,
    };
  }
} 