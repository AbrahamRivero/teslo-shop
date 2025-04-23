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

      const order = this.orderRepository.create({
        ...toSave,
        orderItems: orderItems.map((item) =>
          this.orderItemRepository.create({
            product: { id: item.product },
            quantity: item.quantity,
          }),
        ),
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
        product: item.product.id,
      })),
    }));
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
}
