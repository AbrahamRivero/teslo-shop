/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatsDto } from './dto/order-stats.dto';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger('OrderService');

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    try {
      const { orderItems = [], ...toSave } = createOrderDto;

      let orderNumber: string;
      let trackingNumber: string;

      do {
        orderNumber = this.generateOrderNumber();
      } while (await this.orderRepository.findOne({ where: { orderNumber } }));

      do {
        trackingNumber = this.generateTrackingNumber();
      } while (
        await this.orderRepository.findOne({ where: { trackingNumber } })
      );

      const order = this.orderRepository.create({
        ...toSave,
        orderItems: orderItems.map((item) =>
          this.orderItemRepository.create({
            product: { id: item.product },
            quantity: item.quantity,
            size: item.size,
          }),
        ),
        orderNumber,
        trackingNumber,
        user,
      });

      await this.orderRepository.save(order);

      return { ...order, orderItems };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [orders, total] = await Promise.all([
      this.orderRepository.find({
        take: limit,
        skip: offset,
        relations: {
          orderItems: {
            product: true,
          },
        },
      }),
      this.orderRepository.count(),
    ]);

    return {
      orders: orders.map(({ orderItems, ...rest }) => ({
        ...rest,

        orderItems: orderItems?.map((item) => ({
          ...item,
          product: {
            id: item.product.id,
            title: item.product.title,
            stock: item.product.stock,
            price: item.product.price,
            images: item.product.images?.map((image) => image.url),
          },
        })),
      })),
      total,
    };
  }

  async findUserOrders(paginationDto: PaginationDto, userId: string) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [orders, total] = await Promise.all([
      this.orderRepository.find({
        where: { user: { id: userId } },
        take: limit,
        skip: offset,
        relations: {
          orderItems: {
            product: true,
          },
        },
      }),
      this.orderRepository.count(),
    ]);

    return {
      orders: orders.map(({ orderItems, ...rest }) => ({
        ...rest,

        orderItems: orderItems?.map((item) => ({
          ...item,
          product: {
            id: item.product.id,
            title: item.product.title,
            stock: item.product.stock,
            price: item.product.price,
            images: item.product.images?.map((image) => image.url),
          },
        })),
      })),
      total,
    };
  }

  async findOne(id: string) {
    const response = await this.orderRepository.findOneBy({
      id,
    });

    if (!response)
      throw new NotFoundException(`Order with id ${id} not found.`);

    const order = {
      ...response,
      orderItems: response.orderItems?.map((item) => ({
        ...item,
        product: {
          id: item.product.id,
          title: item.product.title,
          stock: item.product.stock,
          price: item.product.price,
          images: item.product.images?.map((image) => image.url),
        },
      })),
    };

    return order;
  }

  async findOnePlain(term: string) {
    const { orderItems = [], ...rest } = await this.findOne(term);

    return {
      ...rest,
      orderItems: orderItems?.map((item) => ({
        ...item,
        product: item.product.id,
      })),
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: User) {
    const { orderItems, ...toUpdate } = updateOrderDto;

    const order = await this.orderRepository.preload({ id, ...toUpdate });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (orderItems) {
        await queryRunner.manager.delete(OrderItem, { order: { id } });

        order.orderItems = orderItems.map((item) =>
          this.orderItemRepository.create({
            product: { id: item.product },
            quantity: item.quantity,
            size: item.size,
          }),
        );
      }
      order.user = user;
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const order = await this.findOne(id);

    await this.orderRepository.remove(order as Order);
  }

  private setDayStart(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  private setDayEnd(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  private calculateDateRanges(orderStatsDto: OrderStatsDto) {
    const { period, startDate, endDate } = orderStatsDto;
    let currentStartDate: Date;
    let currentEndDate: Date;
    let comparisonStartDate: Date;
    let comparisonEndDate: Date;

    if (startDate && endDate) {
      currentStartDate = this.setDayStart(new Date(startDate));
      currentEndDate = this.setDayEnd(new Date(endDate));

      const diffTime =
        Math.abs(currentEndDate.getTime() - currentStartDate.getTime()) + 1; // +1 para incluir el día final

      comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
      comparisonEndDate.setDate(currentStartDate.getDate() - 1);
      comparisonStartDate = new Date(comparisonEndDate.getTime() - diffTime);
      comparisonStartDate = this.setDayStart(comparisonStartDate);
    } else {
      currentEndDate = this.setDayEnd(new Date()); // Hoy a las 23:59:59

      switch (period) {
        case 'week':
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setDate(currentEndDate.getDate() - 6); // 6 días atrás + hoy = 7 días

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 6);
          break;

        case 'two-weeks':
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setDate(currentEndDate.getDate() - 13); // 13 días atrás + hoy = 14 días

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 13);
          break;

        case 'month':
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setMonth(currentEndDate.getMonth() - 1);

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 1);
          break;

        case 'quarter':
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setMonth(currentEndDate.getMonth() - 3);

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 3);
          break;

        case 'year':
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setFullYear(currentEndDate.getFullYear() - 1);

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setFullYear(comparisonEndDate.getFullYear() - 1);
          break;

        default:
          // Por defecto, se usa la lógica de la semana.
          currentStartDate = this.setDayStart(new Date(currentEndDate));
          currentStartDate.setDate(currentEndDate.getDate() - 6);

          comparisonEndDate = this.setDayEnd(new Date(currentStartDate));
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = this.setDayStart(new Date(comparisonEndDate));
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 6);
          break;
      }
    }
    return {
      current: { startDate: currentStartDate, endDate: currentEndDate },
      comparison: {
        startDate: comparisonStartDate,
        endDate: comparisonEndDate,
      },
    };
  }

  async getDashboardSummary(orderStatsDto: OrderStatsDto) {
    try {
      const { current, comparison } = this.calculateDateRanges(orderStatsDto);

      const getCurrentPeriodStats = async (start: Date, end: Date) => {
        const query = this.orderRepository.createQueryBuilder('order');

        const orders = await query
          .leftJoinAndSelect('order.orderItems', 'orderItem')
          .leftJoinAndSelect('orderItem.product', 'product')
          .leftJoinAndSelect('product.images', 'productImage')
          .leftJoinAndSelect('order.user', 'user')
          .where('order.orderStatus = :status', { status: 'completed' })
          .andWhere('order.createdAt BETWEEN :start AND :end', {
            start,
            end,
          })
          .getMany();

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce(
          (sum, order) => sum + order.total,
          0,
        );
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalProductsSold = orders.reduce(
          (sum, order) =>
            sum +
            order.orderItems.reduce(
              (itemSum, item) => itemSum + item.quantity,
              0,
            ),
          0,
        );
        const uniqueUsers = new Set(orders.map((order) => order.user.id)).size;

        return {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          totalProductsSold,
          uniqueUsers,
          orders,
        };
      };

      const currentPeriodStatsResult = await getCurrentPeriodStats(
        current.startDate,
        current.endDate,
      );
      const comparisonPeriodStats = await getCurrentPeriodStats(
        comparison.startDate,
        comparison.endDate,
      );

      const { orders: rawCurrentOrders, ...currentPeriodStats } =
        currentPeriodStatsResult;

      const detailedCurrentOrders = rawCurrentOrders.map(
        ({ orderItems, ...rest }) => ({
          ...rest,
          orderItems: orderItems?.map((item) => ({
            ...item,
            product: {
              id: item.product.id,
              title: item.product.title,
              stock: item.product.stock,
              price: item.product.price,
              images: item.product.images?.map((image) => image.url),
            },
          })),
        }),
      );

      const percentageChanges = {
        totalOrders: this.calculatePercentageChange(
          currentPeriodStats.totalOrders,
          comparisonPeriodStats.totalOrders,
        ),
        totalRevenue: this.calculatePercentageChange(
          currentPeriodStats.totalRevenue,
          comparisonPeriodStats.totalRevenue,
        ),
        averageOrderValue: this.calculatePercentageChange(
          currentPeriodStats.averageOrderValue,
          comparisonPeriodStats.averageOrderValue,
        ),
        totalProductsSold: this.calculatePercentageChange(
          currentPeriodStats.totalProductsSold,
          comparisonPeriodStats.totalProductsSold,
        ),
        uniqueUsers: this.calculatePercentageChange(
          currentPeriodStats.uniqueUsers,
          comparisonPeriodStats.uniqueUsers,
        ),
      };

      return {
        currentPeriod: currentPeriodStats,
        comparisonPeriod: comparisonPeriodStats,
        percentageChanges,
        currentPeriodOrders: detailedCurrentOrders,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async getTopUsersByOrders(orderStatsDto: OrderStatsDto) {
    try {
      const { current } = this.calculateDateRanges(orderStatsDto);
      const { startDate, endDate } = current;

      const topUsers = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.user.id', 'userId')
        .addSelect('user.email', 'userEmail') // Assuming user.email is accessible via the relation
        .addSelect('COUNT(order.id)', 'orderCount')
        .innerJoin('order.user', 'user') // Join with user entity to get user details
        .where('order.orderStatus = :status', { status: 'completed' })
        .andWhere('order.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('order.user.id')
        .addGroupBy('user.email') // Group by user email as well if displaying it
        .orderBy('"orderCount"', 'DESC')
        .limit(10)
        .getRawMany();

      return topUsers;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async getTopProductsByOrders(orderStatsDto: OrderStatsDto) {
    try {
      const { current } = this.calculateDateRanges(orderStatsDto);
      const { startDate, endDate } = current;

      const topProducts = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('product.id', 'productId')
        .addSelect('product.title', 'productTitle')
        .addSelect('SUM(orderItem.quantity)', 'totalQuantitySold')
        .leftJoin('orderItem.order', 'order')
        .leftJoin('orderItem.product', 'product')
        .where('order.orderStatus = :status', { status: 'completed' })
        .andWhere('order.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('product.id')
        .addGroupBy('product.title')
        .orderBy('"totalQuantitySold"', 'DESC')
        .limit(10)
        .getRawMany();

      return topProducts;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new ConflictException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async deleteAllProducts() {
    const query = this.orderRepository.createQueryBuilder('order');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private orderCounter = 1; // Contador para generar números de orden

  generateOrderNumber(): string {
    return `ORD-${this.randomString(6)}`;
  }

  private trackingCounter = 1; // Contador para generar números de seguimiento

  generateTrackingNumber(): string {
    return `TRK-${this.randomString(6)}`;
  }

  private randomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  private calculatePercentageChange(
    currentValue: number,
    previousValue: number,
  ): number | string {
    if (previousValue === 0) {
      if (currentValue === 0) {
        return 0; // No change if both are zero
      } else {
        return 100; // Return 100% for growth from zero
      }
    } else {
      return ((currentValue - previousValue) / previousValue) * 100;
    }
  }
}
