import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../task.entity';
import { TasksService } from '../task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskType } from '../task-type.enum';

describe('TasksService', () => {
  let service: TasksService;
  let repo: { create: jest.Mock; save: jest.Mock };
  const userId = 'user-1';

  beforeEach(async () => {
    repo = {
      create: jest.fn((entity: Partial<Task>) => entity),
      save: jest.fn((entity: Partial<Task>) =>
        Promise.resolve({ id: 'task-1', createdAt: new Date(), ...entity }),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('grava a tarefa diária com todos os dias da semana, ignorando o que vier no DTO', async () => {
      const dto: CreateTaskDto = {
        title: 'Beber água',
        type: TaskType.DAILY,
        daysOfWeek: [1],
      };

      const result = await service.create(userId, dto);

      expect(result.daysOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('grava a tarefa semanal sem dias da semana', async () => {
      const dto: CreateTaskDto = {
        title: 'Revisar metas',
        type: TaskType.WEEKLY,
        daysOfWeek: [2],
      };

      const result = await service.create(userId, dto);

      expect(result.daysOfWeek).toBeNull();
    });

    it('grava a tarefa customizada com os dias ordenados', async () => {
      const dto: CreateTaskDto = {
        title: 'Treinar',
        type: TaskType.CUSTOM,
        daysOfWeek: [5, 1, 3],
      };

      const result = await service.create(userId, dto);

      expect(result.daysOfWeek).toEqual([1, 3, 5]);
    });

    it.each([[undefined], [[]]])(
      'rejeita tarefa customizada sem dias (%p)',
      async (daysOfWeek) => {
        const dto: CreateTaskDto = {
          title: 'Treinar',
          type: TaskType.CUSTOM,
          daysOfWeek,
        };

        await expect(service.create(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
        expect(repo.save).not.toHaveBeenCalled();
      },
    );

    it('associa a tarefa ao usuário informado e copia só os campos esperados', async () => {
      const dto = {
        title: 'Ler',
        description: '20 páginas',
        type: TaskType.DAILY,
        userId: 'outro-usuario',
      } as CreateTaskDto;

      await service.create(userId, dto);

      expect(repo.create).toHaveBeenCalledWith({
        title: 'Ler',
        description: '20 páginas',
        type: TaskType.DAILY,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        userId,
      });
    });
  });
});