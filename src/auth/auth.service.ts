/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { hashSync, compareSync } from 'bcrypt';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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

      await this.userRepository.save(user);
      const { password: _, ...userWithoutPassword } = user;

      return {
        ...userWithoutPassword,
        token: this.getJwtToken({ email: user.email }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async signIn(signInUserDto: SignInUserDto) {
    const { password, email } = signInUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true },
    });

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if (!compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)');

    return {
      ...user,
      token: this.getJwtToken({ email: user.email }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors = (error: any): never => {
    if (error.code === '23505') throw new ConflictException(error.detail);

    throw new InternalServerErrorException('Please check server logs.');
  };
}
