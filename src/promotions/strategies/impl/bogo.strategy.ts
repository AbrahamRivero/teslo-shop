/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { IPromotionStrategy, PromotionContext, AppliedPromotion } from '../promotion.strategy.interface';
import { Promotion, PromotionType } from '../../entities/promotion.entity';

interface BogoConditions {
  buyProductId: string;
  getProductId: string;
  buyQuantity: number;
  getQuantity: number;
  maxApplications?: number;
}

@Injectable()
export class BogoStrategy implements IPromotionStrategy {
  isApplicable(context: PromotionContext, promotion: Promotion): boolean {
    if (promotion.type !== PromotionType.BOGO) {
      return false;
    }

    const conditions = promotion.conditions as BogoConditions;
    const { buyProductId, buyQuantity } = conditions;

    // Buscar el producto que debe comprarse
    const buyProduct = context.items.find(
      item => item.product.id === buyProductId && item.quantity >= buyQuantity
    );

    return !!buyProduct;
  }

  apply(context: PromotionContext, promotion: Promotion): AppliedPromotion {
    const conditions = promotion.conditions as BogoConditions;
    const { buyProductId, getProductId, buyQuantity, getQuantity, maxApplications = 1 } = conditions;

    // Encontrar el producto que debe comprarse
    const buyProduct = context.items.find(item => item.product.id === buyProductId);
    if (!buyProduct) {
      return {
        promotionId: promotion.id,
        title: promotion.title,
        type: promotion.type,
        discountAmount: 0,
        description: 'No se cumplen las condiciones para la promoción BOGO',
        affectedItems: [],
      };
    }

    // Calcular cuántas veces se puede aplicar la promoción
    const possibleApplications = Math.floor(buyProduct.quantity / buyQuantity);
    const applications = Math.min(possibleApplications, maxApplications);

    // Encontrar el producto que se regala
    const getProduct = context.items.find(item => item.product.id === getProductId);
    if (!getProduct) {
      return {
        promotionId: promotion.id,
        title: promotion.title,
        type: promotion.type,
        discountAmount: 0,
        description: 'Producto gratuito no encontrado en el carrito',
        affectedItems: [],
      };
    }

    // Calcular el descuento total
    const discountAmount = getProduct.price * getQuantity * applications;

    return {
      promotionId: promotion.id,
      title: promotion.title,
      type: promotion.type,
      discountAmount,
      description: `Compra ${buyQuantity} ${buyProduct.product.title}, lleva ${getQuantity} ${getProduct.product.title} gratis`,
      affectedItems: [buyProduct, getProduct],
    };
  }
} 