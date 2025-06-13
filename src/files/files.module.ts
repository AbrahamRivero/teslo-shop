/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { UploadcareService } from './uploadcare.service';

@Module({
  controllers: [FilesController],
  providers: [UploadcareService],
  imports: [ConfigModule],
})
export class FilesModule {}
