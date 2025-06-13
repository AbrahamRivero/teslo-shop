/* eslint-disable prettier/prettier */
import { Product } from '../../products/entities/product.entity';
import { Promotion } from '../entities/promotion.entity';

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface PromotionContext {
  items: CartItem[];
  subtotal: number;
  userId?: string;
  userGroups?: string[];
}

export interface AppliedPromotion {
  promotionId: string;
  title: string;
  type: string;
  discountAmount: number;
  description: string;
  affectedItems?: CartItem[];
}

export interface IPromotionStrategy {
  /**
   * Verifica si la promoción es aplicable al contexto actual
   * @param context El contexto del carrito y usuario
   * @param promotion Los datos de la promoción
   */
  isApplicable(context: PromotionContext, promotion: Promotion): boolean;

  /**
   * Calcula y aplica el descuento de la promoción
   * @param context El contexto del carrito y usuario
   * @param promotion Los datos de la promoción
   * @returns El resultado de la promoción aplicada
   */
  apply(context: PromotionContext, promotion: Promotion): AppliedPromotion;
} 