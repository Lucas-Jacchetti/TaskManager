import { UnauthorizedException } from '@nestjs/common';
import {
  extractUserId,
  type AuthenticatedRequest,
} from './current-user-id.decorator';

const makeRequest = (partial: object) => partial as AuthenticatedRequest;

describe('extractUserId', () => {
  it('devolve o userId do usuário autenticado', () => {
    const request = makeRequest({ user: { userId: 'user-1' } });

    expect(extractUserId(request)).toBe('user-1');
  });

  it('lança Unauthorized quando não há usuário autenticado', () => {
    expect(() => extractUserId(makeRequest({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('ignora o cabeçalho x-user-id', () => {
    const request = makeRequest({
      headers: { 'x-user-id': 'outro-usuario' },
    });

    expect(() => extractUserId(request)).toThrow(UnauthorizedException);
  });
});