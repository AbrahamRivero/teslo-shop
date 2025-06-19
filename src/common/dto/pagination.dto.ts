/* eslint-disable prettier/prettier */
import { ApiPropertyOptional, ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export enum AvailabilityStatus {
  Available = 'available',
  OutOfStock = 'out_of_stock',
}

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

  @ApiProperty({
    required: false,
    description:
      'Campo para ordenar: title_asc, title_desc, price_asc, price_desc, newest (más recientes primero), oldest (más antiguos primero)',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Availability of items to return',
    nullable: true,
    default: AvailabilityStatus.Available,
  })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @ApiPropertyOptional({
    description: 'Minimum price of items to return',
    nullable: true,
    examples: [0, 100, 200, 300],
  })
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price of items to return',
    nullable: true,
    examples: [1000, 2000, 3000],
  })
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Gender of items to return',
    nullable: true,
    example: 'men',
  })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Sizes of items to return',
    nullable: true,
    examples: ['S', 'M', 'L', 'XL'],
  })
  @IsOptional()
  sizes?: string | string[];

  @ApiPropertyOptional({
    description: 'Tags of items to return',
    nullable: true,
    examples: ['tag1', 'tag2', 'tag3'],
  })
  @IsOptional()
  tags?: string | string[];
}
