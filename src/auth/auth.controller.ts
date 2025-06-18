/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { SignUpUserDto, SignInUserDto, RefreshTokenDto } from './dto';
import { User, UserWithOutPassword } from './entities/user.entity';
import { Auth } from './decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserWithOutPassword,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiBody({ type: SignUpUserDto })
  @Post('sign-up')
  signUp(@Body() signUpUserDto: SignUpUserDto) {
    return this.authService.signUp(signUpUserDto);
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiOkResponse({
    description: 'User signed in successfully',
    type: UserWithOutPassword,
  })
  @ApiBadRequestResponse({ description: 'Ha ocurrido un error inesperado.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: SignInUserDto })
  @Post('sign-in')
  signIp(@Body() signInUserDto: SignInUserDto) {
    return this.authService.signIn(signInUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiOkResponse({
    description: 'Authentication status checked successfully',
  })
  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Access token refreshed' })
  @ApiBadRequestResponse({ description: 'Refresh token inválido' })
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
