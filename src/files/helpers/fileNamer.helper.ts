/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

export const fileNamer = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) {
    callback(new BadRequestException('No file provided'), false);
    return;
  }

  const fileExtension = file.mimetype.split('/')[1].toLowerCase();

  const fileName = `${uuid()}.${fileExtension}`;

  callback(null, fileName);
};
