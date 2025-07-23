/* eslint-disable prettier/prettier */
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

    const orders = await this.orderRepository.find({
      take: limit,
      skip: offset,
      relations: { orderItems: true },
    });

    return orders.map(({ orderItems, ...rest }) => ({
      ...rest,

      orderItems: orderItems?.map((item) => ({
        ...item,
        product: {
          id: item.product.id,
          title: item.product.title,
          stock:item.product.stock,
          price: item.product.price,
          image: item.product.images ? item.product.images[0].url : null,
        },
      })),
    }));
  }

  async findUserOrders(
    paginationDto: PaginationDto,
    userId: string,
  ): Promise<Order[]> {
    const { limit, offset } = paginationDto;

    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      take: limit,
      skip: offset,
    });

    return orders;
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOneBy({
      id,
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found.`);

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

    await this.orderRepository.remove(order);
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
}
