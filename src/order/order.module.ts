/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { Order, OrderItem } from './entities';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), AuthModule],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
