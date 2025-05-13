/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.helper';

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadcareService } from './uploadcare.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly uploadcareService: UploadcareService) {}

  @ApiOperation({ summary: 'Get optimized image URL' })
  @ApiOkResponse({ description: 'Optimized image URL' })
  @ApiQuery({ name: 'width', required: false, type: Number })
  @ApiQuery({ name: 'height', required: false, type: Number })
  @ApiQuery({ name: 'format', required: false, enum: ['jpeg', 'png', 'webp'] })
  @ApiQuery({ name: 'quality', required: false, type: Number })
  @Get('optimize')
  getOptimizedImageUrl(
    @Query('url') url: string,
    @Query('width') width?: number,
    @Query('height') height?: number,
    @Query('format') format?: 'jpeg' | 'png' | 'webp',
    @Query('quality') quality?: number,
  ) {
    if (!url) {
      throw new BadRequestException('Image URL is required');
    }

    return {
      optimizedUrl: this.uploadcareService.getOptimizedUrl(url, {
        width,
        height,
        format,
        quality,
      }),
    };
  }

  @ApiOperation({ summary: 'Upload product images' })
  @ApiOkResponse({ description: 'Product images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of images',
  })
  @Post('products')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    const cdnUrl = await this.uploadcareService.uploadFile(file);

    return {
      secureUrl: cdnUrl,
      optimizedUrl: this.uploadcareService.getOptimizedUrl(cdnUrl, {
        width: 800,
        format: 'webp',
        quality: 80,
      }),
    };
  }
}
