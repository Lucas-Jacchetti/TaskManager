import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TasksService } from '../task.service';
import { TaskOccurrence } from '../task-ocurrence.entity';
import { Task } from '../task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskRecurrence } from '../task-recurrence.enum';
import { TaskType } from '../task-type.enum';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function createQueryBuilderMock(result: unknown[] = []) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };
}

describe('TasksService', () => {
  let service: TasksService;
  const userId = 'user-1';
  const today = '2026-10-16'; // sexta-feira; a semana começa em 2026-10-12

  let tasksRepo: { find: jest.Mock };
  let occurrencesRepo: { createQueryBuilder: jest.Mock };
  let txTasksRepo: { create: jest.Mock; save: jest.Mock };
  let txOccurrencesRepo: { create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    tasksRepo = { find: jest.fn().mockResolvedValue([]) };
    occurrencesRepo = { createQueryBuilder: jest.fn() };

    txTasksRepo = {
      create: jest.fn((entity: Partial<Task>) => entity),
      save: jest.fn((entity: Partial<Task>) =>
        Promise.resolve({ id: 'task-1', createdAt: new Date(), ...entity }),
      ),
    };
    txOccurrencesRepo = {
      create: jest.fn((entity: Partial<TaskOccurrence>) => entity),
      save: jest.fn((entities: unknown) => Promise.resolve(entities)),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Task ? txTasksRepo : txOccurrencesRepo,
      ),
    };
    dataSource = {
      transaction: jest.fn((callback: (m: typeof manager) => unknown) =>
        callback(manager),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        {
          provide: getRepositoryToken(TaskOccurrence),
          useValue: occurrencesRepo,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('gera as ocorrências diárias de hoje até domingo', async () => {
      const dto: CreateTaskDto = {
        title: 'Beber água',
        type: TaskType.DAILY,
        recurrence: TaskRecurrence.ONCE,
        daysOfWeek: [1],
      };

      await service.create(userId, dto, today);

      expect(txTasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ daysOfWeek: ALL_DAYS }),
      );
      expect(txOccurrencesRepo.save).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-16' },
        { taskId: 'task-1', referenceDate: '2026-10-17' },
        { taskId: 'task-1', referenceDate: '2026-10-18' },
      ]);
    });

    it('gera uma única ocorrência, na segunda-feira, para tarefa semanal', async () => {
      const dto: CreateTaskDto = {
        title: 'Revisar metas',
        type: TaskType.WEEKLY,
        recurrence: TaskRecurrence.RECURRING,
      };

      await service.create(userId, dto, today);

      expect(txTasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ daysOfWeek: null }),
      );
      expect(txOccurrencesRepo.save).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-12' },
      ]);
    });

    it('grava os dias customizados ordenados e gera só os que ainda restam na semana', async () => {
      const dto: CreateTaskDto = {
        title: 'Treinar',
        type: TaskType.CUSTOM,
        recurrence: TaskRecurrence.ONCE,
        daysOfWeek: [5, 1, 3],
      };

      await service.create(userId, dto, today);

      expect(txTasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ daysOfWeek: [1, 3, 5] }),
      );
      expect(txOccurrencesRepo.save).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-16' },
      ]);
    });

    it.each([[undefined], [[]]])(
      'rejeita tarefa customizada sem dias (%p)',
      async (daysOfWeek) => {
        const dto: CreateTaskDto = {
          title: 'Treinar',
          type: TaskType.CUSTOM,
          recurrence: TaskRecurrence.ONCE,
          daysOfWeek,
        };

        await expect(service.create(userId, dto, today)).rejects.toThrow(
          BadRequestException,
        );
        expect(dataSource.transaction).not.toHaveBeenCalled();
      },
    );

    it('associa a tarefa ao usuário informado e copia só os campos esperados', async () => {
      const dto = {
        title: 'Ler',
        description: '20 páginas',
        type: TaskType.DAILY,
        recurrence: TaskRecurrence.RECURRING,
        userId: 'outro-usuario', 
      } as CreateTaskDto;

      await service.create(userId, dto, today);

      expect(txTasksRepo.create).toHaveBeenCalledWith({
        title: 'Ler',
        description: '20 páginas',
        type: TaskType.DAILY,
        recurrence: TaskRecurrence.RECURRING,
        daysOfWeek: ALL_DAYS,
        userId,
      });
    });
  });

  describe('findToday', () => {
    it('garante as ocorrências recorrentes da semana, sem duplicar', async () => {
      const qb = createQueryBuilderMock();
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);
      tasksRepo.find.mockResolvedValue([
        { id: 'task-1', type: TaskType.DAILY, daysOfWeek: ALL_DAYS },
      ]);

      await service.findToday(userId, today);

      expect(tasksRepo.find).toHaveBeenCalledWith({
        where: { userId, recurrence: TaskRecurrence.RECURRING },
      });
      const rows = qb.values.mock.calls[0][0] as unknown[];
      expect(rows).toHaveLength(7);
      expect(rows).toContainEqual({
        taskId: 'task-1',
        referenceDate: '2026-10-12',
      });
      expect(qb.orIgnore).toHaveBeenCalled();
    });

    it('não grava nada quando não há tarefas recorrentes', async () => {
      const qb = createQueryBuilderMock();
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findToday(userId, today);

      expect(qb.insert).not.toHaveBeenCalled();
    });

    it('filtra por usuário, data e dia da semana e devolve o resultado', async () => {
      const occurrences = [{ id: 'occ-1' }];
      const qb = createQueryBuilderMock(occurrences);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findToday(userId, today);

      expect(result).toBe(occurrences);
      expect(qb.where).toHaveBeenCalledWith('task.userId = :userId', {
        userId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'occurrence.referenceDate = :today',
        { today },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ANY(task.daysOfWeek)'),
        { daily: TaskType.DAILY, custom: TaskType.CUSTOM, day: 5 },
      );
    });
  });

  describe('findWeekly', () => {
    it('filtra tarefas semanais pela segunda-feira da semana', async () => {
      const qb = createQueryBuilderMock([]);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findWeekly(userId, today);

      expect(qb.where).toHaveBeenCalledWith('task.userId = :userId', {
        userId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('task.type = :weekly', {
        weekly: TaskType.WEEKLY,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'occurrence.referenceDate = :weekStart',
        { weekStart: '2026-10-12' },
      );
    });
  });
});