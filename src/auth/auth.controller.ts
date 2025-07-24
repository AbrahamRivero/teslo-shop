/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Controller,
  Post,
  Body,
  Get,
  Response,
  Request,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { SignUpUserDto, SignInUserDto } from './dto';
import { User, UserWithOutPassword } from './entities/user.entity';
import { Auth } from './decorators';
import { Response as Res } from 'express';
import { UnauthorizedException } from '@nestjs/common';

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
  async signUp(@Body() signUpUserDto: SignUpUserDto, @Response() res: Res) {
    const data = await this.authService.signUp(signUpUserDto);
    if (data && data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      });
      const { refreshToken: _, ...rest } = data;
      res.json(rest);
      return;
    }
    res.json(data);
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
  async signIp(@Body() signInUserDto: SignInUserDto, @Response() res: Res) {
    const data = await this.authService.signIn(signInUserDto);
    if (data && data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      });
      const { refreshToken: _, ...rest } = data;
      res.json(rest);
      return;
    }
    res.json(data);
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
  async refreshToken(
    @Response() res: Res,
    @Request() req: { cookies: { refreshToken?: string } },
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException({ message: 'No refresh token provided' });
    }
    const data = await this.authService.refreshToken({ refreshToken });
    if (data && data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const { refreshToken: _, ...rest } = data;
      res.json(rest);
      return;
    }
    res.json(data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'Logout successful' })
  @Post('logout')
  @Auth()
  async logout(@GetUser() user: User, @Response() res: Res) {
    try {
      await this.authService.logout(user.id);
      res.clearCookie('refreshToken');
      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error durante el logout',
      });
    }
  }
}
