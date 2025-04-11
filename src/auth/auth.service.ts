/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

      return { userWithoutPassword };
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

    return user;
  }

  private handleDBErrors = (error: any): never => {
    if (error.code === '23505') throw new ConflictException(error.detail);

    throw new InternalServerErrorException('Please check server logs.');
  };
}
