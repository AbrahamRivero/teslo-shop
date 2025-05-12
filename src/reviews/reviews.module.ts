/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Review } from './entities/review.entity';
import { ProductsModule } from 'src/products/products.module';
@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [TypeOrmModule.forFeature([Review]), AuthModule, ProductsModule],
  exports: [ReviewsService, TypeOrmModule],
})
export class ReviewsModule {}
