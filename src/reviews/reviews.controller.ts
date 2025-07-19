/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Review } from './entities/review.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import { Auth } from 'src/auth/decorators';
@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Create a new review' })
  @ApiCreatedResponse({
    description: 'Review created successfully',
    type: Review,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiBody({ type: CreateReviewDto })
  @ApiBearerAuth()
  @Post()
  @Auth()
  create(@Body() createReviewDto: CreateReviewDto, @GetUser() user: User) {
    return this.reviewsService.create(createReviewDto, user);
  }

  @ApiOperation({ summary: 'Get all reviews' })
  @ApiOkResponse({ description: 'Reviews found', type: [Review] })
  @ApiNotFoundResponse({ description: 'Reviews not found' })
  @ApiQuery({ type: PaginationDto })
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.reviewsService.findAll(paginationDto);
  }

  @ApiOperation({ summary: 'Get reviews by product id' })
  @ApiOkResponse({ description: 'Reviews found', type: [Review] })
  @ApiNotFoundResponse({
    description: 'Reviews not found or product not found',
  })
  @ApiQuery({ type: PaginationDto })
  @Get('product/:productId')
  findByProductId(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reviewsService.findByProductId(productId, paginationDto);
  }

  @ApiOperation({ summary: 'Get a review by id' })
  @ApiOkResponse({ description: 'Review found', type: Review })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a review' })
  @ApiOkResponse({ description: 'Review updated', type: Review })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReviewDto })
  @ApiBearerAuth()
  @Patch(':id')
  @Auth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser() user: User,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user);
  }

  @ApiOperation({ summary: 'Delete a review' })
  @ApiOkResponse({ description: 'Review deleted', type: Review })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewsService.remove(id, user);
  }
}
