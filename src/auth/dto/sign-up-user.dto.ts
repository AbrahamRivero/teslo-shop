/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpUserDto {
  @ApiProperty({
    description: 'User email',
    required: true,
    example: 'test@test.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User full name',
    required: true,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiProperty({
    description: 'User password',
    required: true,
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe tener una letra mayúscula, una letra minúscula y un número.',
  })
  password: string;
}
