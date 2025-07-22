/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
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
import {
  AvailabilityStatus,
  PaginationDto,
} from 'src/common/dto/pagination.dto';
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

  async findAll(paginationDto: PaginationDto, user?: User) {
    const {
      limit = 10,
      offset = 0,
      sortBy,
      availability,
      minPrice,
      maxPrice,
      gender,
      sizes,
      tags,
      searchterm,
    } = paginationDto;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply filters
    if (availability !== undefined) {
      if (availability === AvailabilityStatus.Available) {
        queryBuilder.andWhere('product.stock > 0');
      } else if (availability === AvailabilityStatus.OutOfStock) {
        queryBuilder.andWhere('product.stock <= 0');
      }
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : [sizes];
      queryBuilder.andWhere('product.sizes && :sizes', { sizes: sizeArray });
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryBuilder.andWhere('product.tags && :tags', { tags: tagArray });
    }

    if (gender) {
      queryBuilder.andWhere('product.gender = :gender', { gender });
    }

    // New condition to search by title
    if (searchterm) {
      queryBuilder.andWhere('product.title ILIKE :searchterm', {
        searchterm: `%${searchterm}%`,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'title_asc':
          queryBuilder.orderBy('product.title', 'ASC');
          break;
        case 'title_desc':
          queryBuilder.orderBy('product.title', 'DESC');
          break;
        case 'price_asc':
          queryBuilder.orderBy('product.price', 'ASC');
          break;
        case 'price_desc':
          queryBuilder.orderBy('product.price', 'DESC');
          break;
        case 'newest':
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;
        case 'oldest':
          queryBuilder.orderBy('product.createdAt', 'ASC');
          break;
      }
    } else {
      queryBuilder.orderBy('product.title', 'ASC');
    }

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    // Load relations
    queryBuilder.leftJoinAndSelect('product.images', 'images');
    queryBuilder.leftJoinAndSelect(
      'product.relatedProducts',
      'relatedProducts',
    );
    queryBuilder.leftJoinAndSelect('product.reviews', 'reviews');

    const products = await queryBuilder.getMany();

    // Si hay un usuario, verificar los favoritos
    let favoriteProducts: string[] = [];
    if (user) {
      const favorites = await this.productFavoritesRepository.find({
        where: { user: { id: user.id } },
        select: { product: { id: true } },
        relations: { product: true },
      });
      favoriteProducts = favorites.map((fav) => fav.product.id);
    }

    return {
      products: products.map(
        ({ images, relatedProducts, reviews, ...rest }) => ({
          ...rest,
          images: images?.map((image) => image.url),
          relatedProducts,
          reviews,
          isFavorite: user ? favoriteProducts.includes(rest.id) : false,
        }),
      ),
      total,
      offset,
      limit,
    };
  }

  async findOne(term: string) {
    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOne({
        where: { id: term },
        relations: ['relatedProducts', 'reviews', 'reviews.user'],
      });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(prod.title) =:title or prod.slug=:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .leftJoinAndSelect('prod.reviews', 'prodReviews')
        .leftJoinAndSelect('prodReviews.user', 'user')
        .leftJoinAndSelect('prod.relatedProducts', 'relatedProducts')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(
        `Producto con el término ${term} no encontrado.`,
      );

    return product;
  }

  async findOnePlain(term: string, user?: User) {
    const {
      images = [],
      relatedProducts = [],
      ...rest
    } = await this.findOne(term);

    // Verificar si el producto está en favoritos
    let isFavorite = false;
    if (user && user.id) {
      isFavorite = await this.isProductInFavorites(rest.id, user);
    }

    return {
      ...rest,
      images: images.map((img) => img.url),
      relatedProducts,
      isFavorite,
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
      isFavorite: true,
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

  async getMostFavoritedProducts(user?: User) {
    interface MostFavoritedProduct {
      id: string;
      title: string;
      price: number;
      slug: string;
      stock: number;
      sizes: string[];
      gender: string;
      tags: string[];
      favoritesCount: number;
      images?: string[];
      isFavorite?: boolean;
    }

    const mostFavoritedProducts = (await this.productFavoritesRepository
      .createQueryBuilder('favorite')
      .select('product.id', 'id')
      .addSelect('product.title', 'title')
      .addSelect('product.price', 'price')
      .addSelect('product.slug', 'slug')
      .addSelect('product.stock', 'stock')
      .addSelect('product.sizes', 'sizes')
      .addSelect('product.gender', 'gender')
      .addSelect('product.tags', 'tags')
      .addSelect('COUNT(favorite.id)', 'favoritesCount')
      .innerJoin('favorite.product', 'product')
      .groupBy('product.id')
      .orderBy('COUNT(favorite.id)', 'DESC')
      .limit(10)
      .getRawMany()) as MostFavoritedProduct[];

    // Obtener las imágenes para cada producto
    const productsWithImages = await Promise.all(
      mostFavoritedProducts.map(async (product) => {
        const images = await this.productImageRepository.find({
          where: { product: { id: product.id } },
          select: ['url'],
        });

        // Verificar si el producto está en favoritos del usuario
        let isFavorite = false;
        if (user && user.id) {
          isFavorite = await this.isProductInFavorites(product.id, user);
        }

        return {
          ...product,
          images: images.map((img) => img.url),
          isFavorite,
        };
      }),
    );

    return productsWithImages;
  }
}
