/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateProductFavoriteDto } from './dto/create-product-favorite.dto';

import { validate as isUUID } from 'uuid';
import { Product, ProductImage, ProductFavorites } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    @InjectRepository(ProductFavorites)
    private readonly productFavoritesRepository: Repository<ProductFavorites>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const {
        images = [],
        relatedProductIds = [],
        ...productDetails
      } = createProductDto;

      const relatedProducts = await this.productRepository.findBy({
        id: In(relatedProductIds),
      });

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
        relatedProducts,
        user,
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: ['images', 'relatedProducts'],
    });

    return products.map(({ images, relatedProducts, ...rest }) => ({
      ...rest,
      images: images?.map((image) => image.url),
      relatedProducts,
    }));
  }

  async findOne(term: string) {
    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOne({
        where: { id: term },
        relations: ['relatedProducts'],
      });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) =:title or slug=:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .leftJoinAndSelect('prod.relatedProducts', 'relatedProducts')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(
        `Producto con el término ${term} no encontrado.`,
      );

    return product;
  }

  async findOnePlain(term: string) {
    const {
      images = [],
      relatedProducts = [],
      ...rest
    } = await this.findOne(term);

    return {
      ...rest,
      images: images.map((img) => img.url),
      relatedProducts,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, relatedProductIds, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate });

    if (!product)
      throw new NotFoundException(`Producto con id: ${id} no encontrado`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }

      if (relatedProductIds) {
        const relatedProducts = await this.productRepository.findBy({
          id: In(relatedProductIds),
        });
        product.relatedProducts = relatedProducts;
      }

      product.user = user;
      await queryRunner.manager.save(product);

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
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new ConflictException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Error inesperado, revisa los registros del servidor',
    );
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async addToFavorites(
    createProductFavoriteDto: CreateProductFavoriteDto,
    user: User,
  ) {
    const { productId } = createProductFavoriteDto;

    const product = await this.findOne(productId);

    const existingFavorite = await this.isProductInFavorites(productId, user);

    if (existingFavorite) {
      throw new ConflictException('El producto ya está en favoritos');
    }

    const favorite = this.productFavoritesRepository.create({
      user,
      product,
    });

    await this.productFavoritesRepository.save(favorite);

    return {
      message: 'Producto agregado a favoritos con éxito',
      favorite,
    };
  }

  async removeFromFavorites(productId: string, user: User) {
    const favorite = await this.productFavoritesRepository.findOne({
      where: {
        user: { id: user.id },
        product: { id: productId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Producto no encontrado en favoritos');
    }

    await this.productFavoritesRepository.remove(favorite);

    return {
      message: 'Producto eliminado de favoritos con éxito',
    };
  }

  async getUserFavorites(user: User) {
    const favorites = await this.productFavoritesRepository.find({
      where: {
        user: { id: user.id },
      },
      relations: {
        product: {
          images: true,
        },
      },
    });

    return favorites.map(({ product }) => ({
      ...product,
      images: product.images?.map((img) => img.url),
    }));
  }

  async isProductInFavorites(productId: string, user: User) {
    const favorite = await this.productFavoritesRepository.findOne({
      where: {
        user: { id: user.id },
        product: { id: productId },
      },
    });

    return !!favorite;
  }

  async getRelatedProducts(productId: string) {
    const product = await this.findOne(productId);

    if (!product) {
      throw new NotFoundException(
        `Producto con id: ${productId} no encontrado`,
      );
    }

    // Implementar búsqueda de productos con categorías similares o etiquetas similares
    const relatedProducts = await this.productRepository.find({
      where: {
        // Definir las condiciones para encontrar productos relacionados
      },
      take: 5,
    });

    return relatedProducts;
  }
}
