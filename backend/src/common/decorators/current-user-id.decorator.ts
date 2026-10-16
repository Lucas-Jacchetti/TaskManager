import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user?: { userId: string };
};

export function extractUserId(request: AuthenticatedRequest): string {
  if (!request.user?.userId) {
    throw new UnauthorizedException('Usuário não autenticado');
  }
  return request.user.userId;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    extractUserId(ctx.switchToHttp().getRequest<AuthenticatedRequest>()),
);