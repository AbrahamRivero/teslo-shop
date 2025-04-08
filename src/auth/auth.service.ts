/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { hashSync } from 'bcrypt';

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

  signIn(signInUserDto: SignInUserDto) {
    return 'This action adds a new auth';
  }

  private handleDBErrors = (error: any): never => {
    if (error.code === '23505') throw new ConflictException(error.detail);

    throw new InternalServerErrorException('Please check server logs.');
  };
}
