import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TasksService } from '../task.service';
import { TaskOccurrence } from '../task-ocurrence.entity';
import { TaskCompletion } from '../task-completion.entity';
import { Task } from '../task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskRecurrence } from '../task-recurrence.enum';
import { TaskType } from '../task-type.enum';
import { UpdateTaskDto } from '../dto/update-task.dto';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function createQueryBuilderMock(result: unknown[] = []) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
    getOne: jest.fn(),
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

  let tasksRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };
  let occurrencesRepo: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
    softRemove: jest.Mock;
  };
  let txTasksRepo: { create: jest.Mock; save: jest.Mock };
  let txOccurrencesRepo: { create: jest.Mock; save: jest.Mock };
  let completionsRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    tasksRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    };
    occurrencesRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      softRemove: jest.fn(),
    };

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
    completionsRepo = {
      findOne: jest.fn(),
      create: jest.fn((entity: Partial<TaskCompletion>) => entity),
      save: jest.fn(),
      delete: jest.fn(),
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
        {
          provide: getRepositoryToken(TaskCompletion),
          useValue: completionsRepo,
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
        startDate: today,
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

  describe('CRUD das definições', () => {
    it('lista as definições do usuário', async () => {
      const tasks = [{ id: 'task-1', userId }];
      tasksRepo.find.mockResolvedValue(tasks);

      await expect(service.findAll(userId)).resolves.toBe(tasks);
      expect(tasksRepo.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('não permite acessar uma definição de outro usuário', async () => {
      tasksRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'task-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(tasksRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', userId },
      });
    });

    it('atualiza a definição e preserva ocorrências já existentes', async () => {
      const task = {
        id: 'task-1',
        userId,
        title: 'Título antigo',
        description: 'Descrição antiga',
        type: TaskType.CUSTOM,
        recurrence: TaskRecurrence.ONCE,
        daysOfWeek: [1, 3],
      };
      const dto: UpdateTaskDto = {
        title: 'Título novo',
        type: TaskType.DAILY,
        recurrence: TaskRecurrence.RECURRING,
      };
      tasksRepo.findOne.mockResolvedValue(task);
      tasksRepo.save.mockImplementation((value: Task) =>
        Promise.resolve(value),
      );

      await expect(service.update(userId, 'task-1', dto)).resolves.toEqual({
        ...task,
        ...dto,
        daysOfWeek: ALL_DAYS,
      });
      expect(tasksRepo.save).toHaveBeenCalledTimes(1);
      expect(occurrencesRepo.softRemove).not.toHaveBeenCalled();
    });

    it('cancela a definição somente se ela pertencer ao usuário', async () => {
      const task = { id: 'task-1', userId };
      tasksRepo.findOne.mockResolvedValue(task);

      await service.remove(userId, 'task-1');

      expect(tasksRepo.softRemove).toHaveBeenCalledWith(task);
    });
  });

  describe('conclusão de ocorrências', () => {
    const occurrence = {
      id: 'occ-1',
      taskId: 'task-1',
      referenceDate: today,
      task: { id: 'task-1', userId },
    };

    function occurrenceQueryBuilder() {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(occurrence);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    }

    it('cria uma conclusão vinculada ao occurrenceId', async () => {
      occurrenceQueryBuilder();
      completionsRepo.findOne.mockResolvedValue(null);

      await service.completeOccurrence(userId, occurrence.id);

      expect(completionsRepo.findOne).toHaveBeenCalledWith({
        where: { occurrenceId: occurrence.id },
      });
      expect(completionsRepo.create).toHaveBeenCalledWith({
        occurrenceId: occurrence.id,
      });
      expect(completionsRepo.save).toHaveBeenCalledWith({
        occurrenceId: occurrence.id,
      });
    });

    it('rejeita a segunda conclusão da mesma ocorrência', async () => {
      occurrenceQueryBuilder();
      completionsRepo.findOne.mockResolvedValue({ id: 'completion-1' });

      await expect(
        service.completeOccurrence(userId, occurrence.id),
      ).rejects.toThrow(ConflictException);
      expect(completionsRepo.save).not.toHaveBeenCalled();
    });

    it('desfaz a conclusão somente após validar o proprietário', async () => {
      occurrenceQueryBuilder();

      await service.uncompleteOccurrence(userId, occurrence.id);

      expect(completionsRepo.delete).toHaveBeenCalledWith({
        occurrenceId: occurrence.id,
      });
    });

    it('rejeita ocorrência de outro usuário', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.completeOccurrence('outro-usuario', occurrence.id),
      ).rejects.toThrow(NotFoundException);
      expect(completionsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remoção e geração de ocorrências', () => {
    it('remove somente a ocorrência solicitada', async () => {
      const qb = createQueryBuilderMock();
      const occurrence = { id: 'occ-1', task: { userId } };
      qb.getOne.mockResolvedValue(occurrence);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await service.removeOccurrence(userId, occurrence.id);

      expect(occurrencesRepo.softRemove).toHaveBeenCalledWith(occurrence);
    });

    it('não gera datas anteriores à criação na semana atual', async () => {
      const qb = createQueryBuilderMock();
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);
      tasksRepo.find.mockResolvedValue([
        {
          id: 'task-1',
          type: TaskType.DAILY,
          daysOfWeek: ALL_DAYS,
          startDate: '2026-10-15',
          createdAt: new Date('2026-10-15T12:00:00Z'),
        },
      ]);

      await service.findToday(userId, today);

      expect(qb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-16' },
        { taskId: 'task-1', referenceDate: '2026-10-17' },
        { taskId: 'task-1', referenceDate: '2026-10-18' },
      ]);
    });

    it('rejeita dias inválidos ao criar uma tarefa customizada', async () => {
      const dto: CreateTaskDto = {
        title: 'Treinar',
        type: TaskType.CUSTOM,
        recurrence: TaskRecurrence.ONCE,
        daysOfWeek: [7],
      };

      await expect(service.create(userId, dto, today)).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});