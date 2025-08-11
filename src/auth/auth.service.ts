/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { hashSync, compareSync } from 'bcrypt';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Order } from 'src/order/entities';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signUpUserDto: SignUpUserDto) {
    try {
      const { password, ...userDto } = signUpUserDto;
      const user = this.userRepository.create({
        ...userDto,
        password: hashSync(password, 10),
      });

      // Generar refresh token JWT
      const refreshtoken = this.getJwtRefreshToken({ id: user.id });
      user.refreshtoken = refreshtoken;

      await this.userRepository.save(user);
      const { password: _, refreshtoken: __, ...userWithoutPassword } = user;

      return {
        ...userWithoutPassword,
        token: this.getJwtToken({ id: user.id }),
        refreshtoken,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async signIn(signInUserDto: SignInUserDto) {
    const { password, email } = signInUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        roles: true,
        isActive: true,
        products: true,
        reviews: true,
        orders: true,
        refreshtoken: true,
      },
    });

    if (!user)
      throw new UnauthorizedException('Inicio de sesión no autorizado.');

    if (!compareSync(password, user.password))
      throw new UnauthorizedException('Inicio de sesión no autorizado.');

    // Generar nuevo refresh token JWT
    const refreshtoken = this.getJwtRefreshToken({ id: user.id });
    user.refreshtoken = refreshtoken;
    await this.userRepository.save(user);

    const { password: _, refreshtoken: __, ...userData } = user;

    return {
      ...userData,
      token: this.getJwtToken({ id: user.id }),
      refreshtoken,
    };
  }

  checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshtoken } = refreshTokenDto;
    if (!refreshtoken || typeof refreshtoken !== 'string') {
      throw new BadRequestException(
        'El refresh token es requerido y debe ser un string.',
      );
    }
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshtoken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido.');
    }
    let user: User | null = null;
    try {
      user = await this.userRepository.findOne({
        where: { id: payload.id, refreshtoken },
      });
    } catch (e) {
      throw new InternalServerErrorException(
        'Error al buscar el usuario en la base de datos.',
      );
    }
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Refresh token inválido o usuario inactivo.',
      );
    }
    // Generar nuevo refresh token y access token
    let newRefreshToken: string;
    try {
      newRefreshToken = this.getJwtRefreshToken({ id: user.id });
      user.refreshtoken = newRefreshToken;
      await this.userRepository.save(user);
    } catch (e) {
      throw new InternalServerErrorException(
        'Error al guardar el nuevo refresh token.',
      );
    }
    return {
      token: this.getJwtToken({ id: user.id }),
      refreshtoken: newRefreshToken,
    };
  }

  private handleDBErrors = (error: any): never => {
    if (error.code === '23505') throw new ConflictException(error.detail);

    throw new InternalServerErrorException('Please check server logs.');
  };

  private getJwtRefreshToken(payload: JwtPayload) {
    // Usar una clave y expiración diferente para el refresh token
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '30d',
    });
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refreshtoken = undefined;
      await this.userRepository.save(user);
    }
    return { message: 'Logout exitoso' };
  }

  async findAllUsers(paginationDto: PaginationDto): Promise<{
    usersWithStats: {
      email: string;
      fullName: string;
      isActive: boolean;
      roles: string[];
      reviewStats: {
        totalReviews: number;
        averageRating: number;
      };
      orderStats: {
        totalCompletedOrders: number;
        averageSpent: number;
      };
    }[];
    total: number;
  }> {
    const { limit = 15, offset = 0 } = paginationDto;

    const [users, total] = await this.userRepository.findAndCount({
      skip: offset,
      take: limit,
      select: ['id', 'email', 'fullName', 'isActive', 'roles'],
      relations: ['reviews', 'orders'],
    });

    const usersWithStats = users.map((user) => {
      const totalReviews = user.reviews?.length || 0;
      const averageRating =
        totalReviews > 0
          ? user.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      const completedOrders =
        user.orders?.filter((order) => order.orderStatus === 'completed') || [];
      const totalOrders = completedOrders.length;
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      const averageSpent = totalOrders > 0 ? totalSpent / totalOrders : 0;

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        roles: user.roles,
        reviewStats: {
          totalReviews: totalReviews,
          averageRating: parseFloat(averageRating.toFixed(2)),
        },
        orderStats: {
          totalCompletedOrders: totalOrders,
          averageSpent: parseFloat(averageSpent.toFixed(2)),
        },
      };
    });

    return {
      usersWithStats,
      total,
    };
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['email', 'fullName', 'isActive', 'roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    const last5OrdersWithRelations = await this.orderRepository.find({
      where: { user: { id } },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['orderItems'],
      select: {
        id: true,
        orderStatus: true,
        orderNumber: true,
        trackingNumber: true,
        total: true,
        shipping: true,
        createdAt: true,
        orderItems: {
          id: true,
          quantity: true,
          size: true,
          product: { title: true, slug: true },
        },
      },
    });

    const last5Orders = last5OrdersWithRelations.map((order) => {
      return {
        id: order.id,
        orderStatus: order.orderStatus,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        shipping: order.shipping,
        total: order.total,
        createdAt: order.createdAt,
        orderItems: order.orderItems.map((orderItem) => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          size: orderItem.size,
          product: {
            title: orderItem.product.title,
            slug: orderItem.product.slug,
          },
        })),
      };
    });

    return {
      ...user,
      last5Orders,
    };
  }

  async softDeleteUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return user;
  }
}
