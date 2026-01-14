/* eslint-disable prettier/prettier */

import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @ApiOperation({ summary: '⚠️ DANGER: Execute seed (ADMIN ONLY)' })
  @ApiOkResponse({ description: 'Seed executed successfully' })
  @Auth(ValidRoles.admin)
  @Get()
  executeSeed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seed is not allowed in production environment');
    }
    return this.seedService.runSeed();
  }
}


