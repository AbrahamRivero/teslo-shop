/* eslint-disable prettier/prettier */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductFavoriteDto } from './dto/create-product-favorite.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  Auth,
  GetUser,
  GetUserOptional,
  OptionalAuth,
} from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { User } from 'src/auth/entities/user.entity';
import { Product } from './entities';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    type: Product,
  })
  @ApiBody({ type: CreateProductDto })
  @ApiBearerAuth()
  @Post()
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: User) {
    return this.productsService.create(createProductDto, user);
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'Products found', type: [Product] })
  @ApiNotFoundResponse({ description: 'Products not found' })
  @Get()
  @OptionalAuth()
  findAll(
    @Query() paginationDto: PaginationDto,
    @GetUserOptional() user?: User,
  ) {
    return this.productsService.findAll(paginationDto, user);
  }

  @ApiOperation({ summary: 'Get most favorited products' })
  @ApiOkResponse({
    description: 'Most favorited products retrieved successfully',
    type: [Product],
  })
  @Get('most-favorited')
  @OptionalAuth()
  getMostFavoritedProducts(@GetUserOptional() user?: User) {
    return this.productsService.getMostFavoritedProducts(user);
  }

  @ApiOperation({ summary: 'Get a product by term' })
  @ApiOkResponse({ description: 'Product found', type: Product })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Get(':term')
  @OptionalAuth()
  findOne(@Param('term') term: string, @GetUserOptional() user?: User) {
    return this.productsService.findOnePlain(term, user);
  }

  @ApiOperation({ summary: 'Obtener productos relacionados' })
  @ApiOkResponse({
    description: 'Productos relacionados encontrados',
    type: [Product],
  })
  @Get(':id/related')
  getRelatedProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getRelatedProducts(id);
  }

  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ description: 'Product updated', type: Product })
  @ApiBody({ type: UpdateProductDto })
  @ApiBearerAuth()
  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @ApiOkResponse({ description: 'Product deleted' })
  @ApiBearerAuth()
  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiCreatedResponse({
    description: 'Product added to favorites successfully',
  })
  @ApiBody({ type: CreateProductFavoriteDto })
  @ApiBearerAuth()
  @Post('favorites')
  @Auth()
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  addToFavorites(
    @Body() createProductFavoriteDto: CreateProductFavoriteDto,
    @GetUser() user: User,
  ) {
    return this.productsService.addToFavorites(createProductFavoriteDto, user);
  }

  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiOkResponse({
    description: 'Product removed from favorites successfully',
  })
  @ApiBearerAuth()
  @Delete('favorites/:productId')
  @Auth()
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  removeFromFavorites(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser() user: User,
  ) {
    return this.productsService.removeFromFavorites(productId, user);
  }

  @ApiOperation({ summary: 'Get user favorites' })
  @ApiOkResponse({
    description: 'User favorites retrieved successfully',
    type: [Product],
  })
  @ApiBearerAuth()
  @Get('favorites')
  @Auth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getUserFavorites(@GetUser() user: User) {
    return this.productsService.getUserFavorites(user);
  }

  @ApiOperation({ summary: 'Check if a product is in favorites' })
  @ApiOkResponse({
    description: 'Favorite status retrieved successfully',
  })
  @ApiBearerAuth()
  @Get('favorites/:productId/check')
  @Auth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  isProductInFavorites(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser() user: User,
  ) {
    return this.productsService.isProductInFavorites(productId, user);
  }
}
