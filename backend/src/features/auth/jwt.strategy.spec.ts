import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('expõe o sub do token como userId', () => {
    const config = {
      getOrThrow: jest.fn().mockReturnValue('segredo-de-teste'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(config);

    expect(strategy.validate({ sub: 'user-1' })).toEqual({ userId: 'user-1' });
  });
});