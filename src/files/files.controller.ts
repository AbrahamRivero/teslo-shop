/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('products')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return file;
  }
}
