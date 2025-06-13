/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import {
  IPromotionStrategy,
  PromotionContext,
  AppliedPromotion,
} from './strategies/promotion.strategy.interface';
import { PercentageDiscountStrategy } from './strategies/impl/percentage-discount.strategy';
import { FreeShippingStrategy } from './strategies/impl/free-shipping.strategy';
import { BogoStrategy } from './strategies/impl/bogo.strategy';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class PromotionsService {
  private strategyMap: Map<string, IPromotionStrategy>;

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly percentageDiscountStrategy: PercentageDiscountStrategy,
    private readonly freeShippingStrategy: FreeShippingStrategy,
    private readonly bogoStrategy: BogoStrategy,
  ) {
    // Inicializar el mapa de estrategias
    this.strategyMap = new Map([
      ['PERCENTAGE_DISCOUNT', this.percentageDiscountStrategy],
      ['FREE_SHIPPING', this.freeShippingStrategy],
      ['BOGO', this.bogoStrategy],
    ]);
  }

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const promotion = this.promotionRepository.create({
      ...createPromotionDto,
      isActive: createPromotionDto.isActive ?? true,
      isCombinable: createPromotionDto.isCombinable ?? true,
    });

    // Si hay productos aplicables, los cargamos
    if (createPromotionDto.applicableProducts?.length > 0) {
      const products = await this.productRepository.findByIds(
        createPromotionDto.applicableProducts.map((p) => p.id),
      );
      promotion.applicableProducts = products;
    }

    return this.promotionRepository.save(promotion);
  }

  async findAll(isActive?: boolean, type?: string): Promise<Promotion[]> {
    const queryBuilder = this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.applicableProducts', 'product');

    if (isActive !== undefined) {
      queryBuilder.andWhere('promotion.isActive = :isActive', { isActive });
    }

    if (type) {
      queryBuilder.andWhere('promotion.type = :type', { type });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['applicableProducts'],
    });

    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    return promotion;
  }

  async update(
    id: string,
    updatePromotionDto: Partial<CreatePromotionDto>,
  ): Promise<Promotion> {
    const promotion = await this.findOne(id);

    // Si hay productos aplicables, los actualizamos
    if (
      updatePromotionDto.applicableProducts &&
      updatePromotionDto.applicableProducts.length > 0
    ) {
      const products = await this.productRepository.findByIds(
        updatePromotionDto.applicableProducts.map((p) => p.id),
      );
      promotion.applicableProducts = products;
    }

    Object.assign(promotion, {
      ...updatePromotionDto,
      isActive: updatePromotionDto.isActive ?? promotion.isActive,
      isCombinable: updatePromotionDto.isCombinable ?? promotion.isCombinable,
    });

    return this.promotionRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const result = await this.promotionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }
  }

  async applyPromotions(context: PromotionContext): Promise<{
    totalDiscount: number;
    appliedPromotions: AppliedPromotion[];
  }> {
    const now = new Date();

    // Obtener todas las promociones activas
    const activePromotions = await this.promotionRepository.find({
      where: {
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { priority: 'ASC' },
    });

    // Filtrar promociones aplicables
    const applicablePromotions = activePromotions.filter((promotion) => {
      const strategy = this.strategyMap.get(promotion.type);
      return strategy?.isApplicable(context, promotion) ?? false;
    });

    // Separar promociones combinables y no combinables
    const combinablePromotions = applicablePromotions.filter(
      (p) => p.isCombinable,
    );
    const nonCombinablePromotions = applicablePromotions.filter(
      (p) => !p.isCombinable,
    );

    // Para promociones no combinables, tomar la de mayor prioridad
    const bestNonCombinable = nonCombinablePromotions[0];

    // Combinar promociones
    const finalPromotions = bestNonCombinable
      ? [bestNonCombinable, ...combinablePromotions]
      : combinablePromotions;

    // Aplicar promociones
    const appliedPromotions: AppliedPromotion[] = [];
    let totalDiscount = 0;

    for (const promotion of finalPromotions) {
      const strategy = this.strategyMap.get(promotion.type);
      if (strategy) {
        const result = strategy.apply(context, promotion);
        appliedPromotions.push(result);
        totalDiscount += result.discountAmount;
      }
    }

    return {
      totalDiscount,
      appliedPromotions,
    };
  }

  // Método para registrar una nueva estrategia
  registerStrategy(type: string, strategy: IPromotionStrategy): void {
    this.strategyMap.set(type, strategy);
  }
}
