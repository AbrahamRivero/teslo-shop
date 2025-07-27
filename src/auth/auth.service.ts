/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
