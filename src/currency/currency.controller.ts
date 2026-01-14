/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import type { CurrencyResponse } from './currency.service';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @ApiOperation({ summary: 'Get current currency rates (USD, EUR, MLC)' })
  @ApiResponse({
    status: 200,
    description: 'Currency rates retrieved successfully',
    schema: {
      example: {
        USD: 290,
        EUR: 315,
        MLC: 320,
        lastUpdate: '2026-01-13',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Unable to fetch currency data' })
   
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get()
  async getCurrencies(): Promise<CurrencyResponse> {
    return this.currencyService.getCurrencies();
  }
}
