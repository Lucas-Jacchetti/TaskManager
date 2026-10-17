import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { register: jest.fn(), login: jest.fn(), me: jest.fn(), };
  

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delega o cadastro ao service', async () => {
    const dto = { name: 'Lucas', email: 'lucas@exemplo.com', password: 'senha-segura-123' };
    authService.register.mockResolvedValue({ id: 'user-1' });

    await expect(controller.register(dto)).resolves.toEqual({ id: 'user-1' });
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delega o login ao service', async () => {
    const dto = { email: 'lucas@exemplo.com', password: 'senha-segura-123' };
    authService.login.mockResolvedValue({ access_token: 'token-jwt' });

    await expect(controller.login(dto)).resolves.toEqual({
      access_token: 'token-jwt',
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('devolve o usuário autenticado', async () => {
    authService.me.mockResolvedValue({ id: 'user-1' });

    await expect(controller.me('user-1')).resolves.toEqual({ id: 'user-1' });
    expect(authService.me).toHaveBeenCalledWith('user-1');
  });
});