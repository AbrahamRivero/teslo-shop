/* eslint-disable prettier/prettier */
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min } from 'class-validator';

@ApiSchema({ name: 'PaginationDto', description: 'Pagination DTO schema' })
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Limit of items to return',
    nullable: true,
    default: 10,
  })
  @IsOptional()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Offset of items to return',
    nullable: true,
    default: 0,
  })
  @IsOptional()
  @Min(0)
  offset?: number;
}
