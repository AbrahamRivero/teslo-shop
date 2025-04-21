/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger('ReviewsService');
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    private readonly productsService: ProductsService,
  ) {}

  async create(createReviewDto: CreateReviewDto, user: User) {
    try {
      const review = this.reviewRepository.create({
        ...createReviewDto,
        user,
      });
      await this.reviewRepository.save(review);
      return review;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const reviews = await this.reviewRepository.find({
      take: limit,
      skip: offset,
      relations: { user: true, product: true },
      order: { rating: 'DESC' },
    });

    return reviews;
  }

  async findOne(id: string) {
    const review = await this.reviewRepository.findOneBy({ id });

    if (!review) throw new NotFoundException(`Review with id: ${id} not found`);

    return review;
  }

  async findByProductId(productId: string, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    await this.productsService.findOne(productId);
    
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId } },
      take: limit,
      skip: offset,
      relations: { user: true, product: true },
      order: { rating: 'DESC' },
    });

    return reviews;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, user: User) {
    const review = await this.findOne(id);

    if (review.user.id !== user.id)
      throw new ForbiddenException(
        `User ${user.id} is not allowed to update review ${id}`,
      );

    try {
      const result = await this.reviewRepository.update(id, updateReviewDto);
      return result;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string, user: User) {
    const review = await this.findOne(id);

    if (review.user.id !== user.id)
      throw new ForbiddenException(
        `User ${user.id} is not allowed to delete review ${id}`,
      );

    await this.reviewRepository.remove(review);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new ConflictException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
