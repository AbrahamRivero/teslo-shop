/* eslint-disable prettier/prettier */

import { BadRequestException } from '@nestjs/common';

export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  // Verificar si el archivo existe
  if (!file) {
    callback(new BadRequestException('No file provided'), false);
    return;
  }

  // Verificar si el mimetype está presente y es una imagen
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    callback(
      new BadRequestException('Invalid file type. Only images are allowed'),
      false,
    );
    return;
  }

  // Extraer la extensión del archivo de manera segura
  const mimeParts = file.mimetype.split('/');
  const fileExtension = mimeParts.length > 1 ? mimeParts[1].toLowerCase() : '';

  // Definir extensiones válidas
  const validExtensions = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'avif',
    'webp',
  ]);

  // Verificar si la extensión es válida
  if (!validExtensions.has(fileExtension)) {
    callback(
      new BadRequestException(
        `Unsupported image format. Allowed formats: ${Array.from(validExtensions).join(', ')}`,
      ),
      false,
    );
    return;
  }

  // Aceptar el archivo
  callback(null, true);
};
