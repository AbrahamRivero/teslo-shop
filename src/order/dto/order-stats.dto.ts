/* eslint-disable prettier/prettier */
import { IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderStatsDto {
  @ApiPropertyOptional({
    description: 'Period for statistics',
    enum: ['week', 'two-weeks', 'month', 'quarter', 'year'],
  })
  @IsOptional()
  @IsIn(['week', 'two-weeks', 'month', 'quarter', 'year'])
  period?: 'week' | 'two-weeks' | 'month' | 'quarter' | 'year';

  @ApiPropertyOptional({
    description: 'Start date for custom period (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom period (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
} 