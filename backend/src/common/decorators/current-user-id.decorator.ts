import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';

// temporario
export function extractUserId(request: Pick<Request, 'headers'>): string {
  const value = request.headers['x-user-id'];
  if (typeof value !== 'string' || !isUUID(value)) {
    throw new UnauthorizedException('Cabeçalho x-user-id ausente ou inválido');
  }
  return value;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    extractUserId(ctx.switchToHttp().getRequest<Request>()),
);