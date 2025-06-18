/* eslint-disable prettier/prettier */
import { applyDecorators, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

export function OptionalAuth() {
  return applyDecorators(UseGuards(OptionalAuthGuard));
} 