/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UploadcareResponse {
  file: string;
  [key: string]: unknown;
}

@Injectable()
export class UploadcareService {
  private readonly uploadcarePublicKey: string;
  private readonly uploadcareSecretKey: string;
  private readonly uploadcareApiUrl = 'https://upload.uploadcare.com/base/';
  private readonly uploadcareStoreUrl = 'https://api.uploadcare.com/files/';

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('UPLOADCARE_PUBLIC_KEY');
    const secretKey = this.configService.get<string>('UPLOADCARE_SECRET_KEY');
    if (!key) {
      throw new Error(
        'UPLOADCARE_PUBLIC_KEY is not defined in environment variables',
      );
    }

    if (!secretKey) {
      throw new Error(
        'UPLOADCARE_SECRET_KEY is not defined in environment variables',
      );
    }
    this.uploadcarePublicKey = key;
    this.uploadcareSecretKey = secretKey;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('UPLOADCARE_PUB_KEY', this.uploadcarePublicKey);
      formData.append('file', new Blob([file.buffer]), file.originalname);

      const response = await fetch(this.uploadcareApiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new BadRequestException(
          `Failed to upload file to Uploadcare: ${JSON.stringify(errorData)}`,
        );
      }

      const data = (await response.json()) as UploadcareResponse;
      if (!data.file) {
        throw new BadRequestException(
          'Invalid response from Uploadcare: missing file ID',
        );
      }

      // Store the file permanently
      await this.storeFile(data.file);

      return `https://ucarecdn.com/${data.file}/`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Error uploading file: ${errorMessage}`);
    }
  }

  private async storeFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.uploadcareStoreUrl}${fileId}/storage/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Uploadcare.Simple ${this.uploadcarePublicKey}:${this.uploadcareSecretKey}`,
            Accept: 'application/vnd.uploadcare-v0.7+json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new BadRequestException(
          `Failed to store file in Uploadcare: ${JSON.stringify(errorData)}`,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Error storing file: ${errorMessage}`);
    }
  }

  getOptimizedUrl(
    fileUrl: string,
    options: {
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png' | 'webp';
      quality?: number;
    } = {},
  ): string {
    const url = new URL(fileUrl);
    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());

    return `${url.origin}${url.pathname}/-/preview/${params.toString()}`;
  }
}
