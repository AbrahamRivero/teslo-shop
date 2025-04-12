# Integración de NestJS con Uploadcare

Para integrar NestJS con Uploadcare y gestionar la subida y recuperación de imágenes, sigue estos pasos:

## 1. Configuración inicial

### Instalar dependencias necesarias
```bash
npm install @uploadcare/rest-client
```

### Configurar módulo Uploadcare

Crea un módulo para Uploadcare:

```typescript
// uploadcare/uploadcare.module.ts
import { Module } from '@nestjs/common';
import { UploadcareService } from './uploadcare.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [UploadcareService],
  exports: [UploadcareService],
})
export class UploadcareModule {}
```

## 2. Crear el servicio Uploadcare

```typescript
// uploadcare/uploadcare.service.ts
import { Injectable } from '@nestjs/common';
import { UploadcareClient } from '@uploadcare/rest-client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UploadcareService {
  private readonly uploadcareClient: UploadcareClient;

  constructor(private readonly httpService: HttpService) {
    this.uploadcareClient = new UploadcareClient({
      publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
      secretKey: process.env.UPLOADCARE_SECRET_KEY,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const formData = new FormData();
    formData.append('file', new Blob([file.buffer]), file.originalname);

    const response = await firstValueFrom(
      this.httpService.post('https://upload.uploadcare.com/base/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Uploadcare.Simple ${process.env.UPLOADCARE_PUBLIC_KEY}:${process.env.UPLOADCARE_SECRET_KEY}`,
        },
      })
    );

    return response.data;
  }

  async getFileInfo(fileId: string) {
    return this.uploadcareClient.files.info({ uuid: fileId });
  }

  async deleteFile(fileId: string) {
    return this.uploadcareClient.files.deleteFile({ uuid: fileId });
  }

  getFileUrl(fileId: string, options?: any) {
    return this.uploadcareClient.files.buildUrl(fileId, options);
  }
}
```

## 3. Configurar variables de entorno

En tu `.env`:
```
UPLOADCARE_PUBLIC_KEY=tu_public_key
UPLOADCARE_SECRET_KEY=tu_secret_key
```

## 4. Crear un controlador para manejar las subidas

```typescript
// uploadcare/uploadcare.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadcareService } from './uploadcare.service';

@Controller('upload')
export class UploadcareController {
  constructor(private readonly uploadcareService: UploadcareService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const uploadResult = await this.uploadcareService.uploadFile(file);
    return {
      fileId: uploadResult.file,
      url: this.uploadcareService.getFileUrl(uploadResult.file),
    };
  }
}
```

## 5. Usar el módulo en tu aplicación

Importa el módulo en tu `app.module.ts`:

```typescript
import { UploadcareModule } from './uploadcare/uploadcare.module';

@Module({
  imports: [UploadcareModule],
  // ...
})
export class AppModule {}
```

## 6. Uso avanzado

### Recuperar imágenes

Para recuperar una imagen, puedes usar:

```typescript
const fileId = 'tu-file-id';
const fileInfo = await this.uploadcareService.getFileInfo(fileId);
const fileUrl = this.uploadcareService.getFileUrl(fileId, {
  // Opciones de transformación
  preview: '500x500',
  quality: 'better',
  format: 'jpeg',
});
```

### Eliminar imágenes

```typescript
await this.uploadcareService.deleteFile(fileId);
```

## 7. Configuración de CORS (opcional)

Si necesitas acceder a las imágenes desde el frontend, asegúrate de configurar CORS en tu cuenta de Uploadcare.

## Consideraciones adicionales

1. **Seguridad**: Nunca expongas tu secret key en el frontend.
2. **Optimización**: Uploadcare ofrece transformaciones de imágenes on-the-fly.
3. **Almacenamiento**: Configura tu bucket en Uploadcare para almacenamiento permanente si es necesario.
4. **Límites**: Revisa los límites de la API de Uploadcare para tu plan.

Esta implementación te permitirá subir, recuperar y gestionar imágenes en Uploadcare desde tu aplicación NestJS.