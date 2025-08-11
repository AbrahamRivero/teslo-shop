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
  Param,
  Query,
  Delete,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { SignUpUserDto, SignInUserDto } from './dto';
import { User, UserWithOutPassword } from './entities/user.entity';
import { Auth } from './decorators';
import { Response as Res } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { ValidRoles } from './interfaces';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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
    if (data && data.refreshtoken) {
      res.cookie('refreshtoken', data.refreshtoken, {
        httpOnly: true,
        secure: true, //asegura de usar https
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const { refreshtoken: _, ...rest } = data;
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
    if (data && data.refreshtoken) {
      res.cookie('refreshtoken', data.refreshtoken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const { refreshtoken: _, ...rest } = data;
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
    @Request() req: { cookies: { refreshtoken?: string } },
  ) {
    const refreshtoken = req.cookies?.refreshtoken;
    if (!refreshtoken) {
      throw new UnauthorizedException({ message: 'No refresh token provided' });
    }
    const data = await this.authService.refreshToken({ refreshtoken });
    if (data && data.refreshtoken) {
      res.cookie('refreshtoken', data.refreshtoken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const { refreshtoken: _, ...rest } = data;
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
      res.clearCookie('refreshtoken');
      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error durante el logout',
      });
    }
  }

  @Get('users')
  @Auth(ValidRoles.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({
    description: 'Returns all users without their passwords',
    type: [UserWithOutPassword],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden (Requires admin role)' })
  findAllUsers(@Query() paginationDto: PaginationDto) {
    return this.authService.findAllUsers(paginationDto);
  }

  @Get('users/:id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({
    description: 'Returns a user without their password',
    type: UserWithOutPassword,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'User not found' })
  findUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a user (admin only)' })
  @ApiOkResponse({
    description: 'User successfully soft deleted',
    type: UserWithOutPassword,
  })
  @ApiForbiddenResponse({ description: 'Forbidden (Requires admin role)' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete('users/:id')
  @Auth(ValidRoles.admin)
  softDeleteUser(@Param('id') id: string) {
    return this.authService.softDeleteUser(id);
  }
}
