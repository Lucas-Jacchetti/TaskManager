import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: { userId: string };
};

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request =
      ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    return request.user.userId;
  },
);