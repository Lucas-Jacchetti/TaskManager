import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { UsersService } from '../user.service';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findByEmail', () => {
    it('busca pelo e-mail normalizado', async () => {
      const user = { id: 'user-1' };
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('  Lucas@Exemplo.COM ');

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'lucas@exemplo.com' },
      });
      expect(result).toBe(user);
    });

    it('devolve null quando o usuário não existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('ninguem@exemplo.com')).resolves.toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    const makeQueryBuilder = (result: unknown) => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result),
    });

    it('inclui a senha na consulta e usa o e-mail normalizado', async () => {
      const user = { id: 'user-1', password: 'senha-hash' };
      const qb = makeQueryBuilder(user);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByEmailWithPassword('  Lucas@Exemplo.COM ');

      expect(usersRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
      expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'lucas@exemplo.com',
      });
      expect(result).toBe(user);
    });

    it('devolve null quando o usuário não existe', async () => {
      usersRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(null));

      await expect(
        service.findByEmailWithPassword('ninguem@exemplo.com'),
      ).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('monta a entidade e grava no banco', async () => {
      const data = {
        name: 'Lucas',
        email: 'lucas@exemplo.com',
        password: 'senha-hash',
      };
      const entity = { ...data };
      const saved = { id: 'user-1', ...data };
      usersRepo.create.mockReturnValue(entity);
      usersRepo.save.mockResolvedValue(saved);

      const result = await service.create(data);

      expect(usersRepo.create).toHaveBeenCalledWith(data);
      expect(usersRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(saved);
    });
  });
});