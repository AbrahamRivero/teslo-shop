/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Param, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(
    private readonly promotionsService: PromotionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva promoción' })
  @ApiResponse({ 
    status: 201, 
    description: 'Promoción creada exitosamente',
    type: Promotion 
  })
  async createPromotion(@Body() createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las promociones' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_SHIPPING', 'BOGO'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de promociones',
    type: [Promotion]
  })
  async getAllPromotions(
    @Query('isActive') isActive?: boolean,
    @Query('type') type?: string,
  ): Promise<Promotion[]> {
    return this.promotionsService.findAll(isActive, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una promoción por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promoción encontrada',
    type: Promotion 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Promoción no encontrada' 
  })
  async getPromotion(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una promoción' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promoción eliminada exitosamente' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Promoción no encontrada' 
  })
  async deletePromotion(@Param('id') id: string): Promise<void> {
    return this.promotionsService.remove(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una promoción' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promoción actualizada exitosamente',
    type: Promotion 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Promoción no encontrada' 
  })
  async updatePromotion(
    @Param('id') id: string,
    @Body() updatePromotionDto: Partial<CreatePromotionDto>,
  ): Promise<Promotion> {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activar una promoción' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promoción activada exitosamente',
    type: Promotion 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Promoción no encontrada' 
  })
  async activatePromotion(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.update(id, { isActive: true });
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar una promoción' })
  @ApiResponse({ 
    status: 200, 
    description: 'Promoción desactivada exitosamente',
    type: Promotion 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Promoción no encontrada' 
  })
  async deactivatePromotion(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.update(id, { isActive: false });
  }
} 