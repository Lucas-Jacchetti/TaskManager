import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { UsersService } from '../users/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  const hash = bcrypt.hash as jest.Mock;
  const compare = bcrypt.compare as jest.Mock;

  const usersService = {
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      name: 'Lucas',
      email: 'lucas@exemplo.com',
      password: 'senha-segura-123',
    };
    const createdAt = new Date('2026-10-16T12:00:00Z');

    it('grava a senha com hash e devolve o usuário sem a senha', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      hash.mockResolvedValue('senha-hash');
      usersService.create.mockResolvedValue({
        id: 'user-1',
        ...dto,
        password: 'senha-hash',
        createdAt,
      });

      const result = await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Lucas',
        email: 'lucas@exemplo.com',
        password: 'senha-hash',
      });
      expect(result).toEqual({
        id: 'user-1',
        name: 'Lucas',
        email: 'lucas@exemplo.com',
        createdAt,
      });
    });

    it('rejeita e-mail já cadastrado', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user-1' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('converte a violação de unicidade do banco em Conflict', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      hash.mockResolvedValue('senha-hash');
      usersService.create.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate key'), { code: '23505' }),
        ),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('repassa erros inesperados', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      hash.mockResolvedValue('senha-hash');
      usersService.create.mockRejectedValue(new Error('falha de conexão'));

      await expect(service.register(dto)).rejects.toThrow('falha de conexão');
    });
  });

  describe('login', () => {
    const dto = { email: 'lucas@exemplo.com', password: 'senha-segura-123' };

    it('devolve o token quando as credenciais são válidas', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        password: 'senha-hash',
      });
      compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('token-jwt');

      const result = await service.login(dto);

      expect(compare).toHaveBeenCalledWith('senha-segura-123', 'senha-hash');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
      expect(result).toEqual({ access_token: 'token-jwt' });
    });

    it('rejeita senha incorreta', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        password: 'senha-hash',
      });
      compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejeita e-mail inexistente, comparando contra um hash fictício', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      hash.mockResolvedValue('hash-ficticio');
      compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(compare).toHaveBeenCalledWith('senha-segura-123', 'hash-ficticio');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('não aceita login quando o hash fictício coincidir por engano', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      hash.mockResolvedValue('hash-ficticio');
      compare.mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});