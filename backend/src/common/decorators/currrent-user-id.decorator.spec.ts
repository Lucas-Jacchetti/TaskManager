import { UnauthorizedException } from '@nestjs/common';
import { extractUserId } from './current-user-id.decorator';

describe('extractUserId', () => {
  const validId = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

  it('devolve o id quando o cabeçalho é um UUID válido', () => {
    expect(extractUserId({ headers: { 'x-user-id': validId } })).toBe(validId);
  });

  it('lança Unauthorized quando o cabeçalho não existe', () => {
    expect(() => extractUserId({ headers: {} })).toThrow(UnauthorizedException);
  });

  it('lança Unauthorized quando o valor não é um UUID', () => {
    expect(() =>
      extractUserId({ headers: { 'x-user-id': 'abc' } }),
    ).toThrow(UnauthorizedException);
  });
});