import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
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
    softRemove: jest.Mock;
  };
  let txTasksRepo: { create: jest.Mock; save: jest.Mock };
  let txOccurrencesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
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
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
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

  describe('geração sob demanda das ocorrências recorrentes', () => {
    let qb: ReturnType<typeof createQueryBuilderMock>;

    const dailyTask = (startDate: string) => ({
      id: 'task-1',
      type: TaskType.DAILY,
      daysOfWeek: ALL_DAYS,
      startDate,
    });
    const weeklyTask = (startDate: string) => ({
      id: 'task-1',
      type: TaskType.WEEKLY,
      daysOfWeek: null,
      startDate,
    });

    beforeEach(() => {
      qb = createQueryBuilderMock();
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);
    });

    it('gera a semana inteira quando a consulta é na segunda e a tarefa é anterior à semana', async () => {
      tasksRepo.find.mockResolvedValue([dailyTask('2026-10-01')]);

      await service.findToday(userId, '2026-10-12');

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

    it('gera só a partir da data consultada', async () => {
      tasksRepo.find.mockResolvedValue([dailyTask('2026-10-01')]);

      await service.findToday(userId, today);

      expect(qb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-16' },
        { taskId: 'task-1', referenceDate: '2026-10-17' },
        { taskId: 'task-1', referenceDate: '2026-10-18' },
      ]);
    });

    it('não gera dias anteriores à criação da tarefa', async () => {
      tasksRepo.find.mockResolvedValue([dailyTask('2026-10-15')]);

      await service.findToday(userId, '2026-10-12');

      expect(qb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-15' },
        { taskId: 'task-1', referenceDate: '2026-10-16' },
        { taskId: 'task-1', referenceDate: '2026-10-17' },
        { taskId: 'task-1', referenceDate: '2026-10-18' },
      ]);
    });

    it('não gera nada para semanas anteriores à criação', async () => {
      tasksRepo.find.mockResolvedValue([dailyTask('2026-10-15')]);

      await service.findToday(userId, '2026-10-07');

      expect(qb.insert).not.toHaveBeenCalled();
    });

    it('gera a ocorrência semanal na segunda mesmo consultando no meio da semana', async () => {
      tasksRepo.find.mockResolvedValue([weeklyTask('2026-10-01')]);

      await service.findWeekly(userId, today);

      expect(qb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-12' },
      ]);
    });

    it('não gera ocorrência semanal antes da semana de criação', async () => {
      tasksRepo.find.mockResolvedValue([weeklyTask('2026-10-15')]);

      await service.findWeekly(userId, '2026-10-07');

      expect(qb.insert).not.toHaveBeenCalled();
    });
  });

  describe('CRUD das definições', () => {
    it('lista as definições do usuário', async () => {
      const tasks = [{ id: 'task-1', userId }];
      tasksRepo.find.mockResolvedValue(tasks);

      await expect(service.findAll(userId)).resolves.toBe(tasks);
      expect(tasksRepo.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('devolve a definição do próprio usuário', async () => {
      const task = { id: 'task-1', userId };
      tasksRepo.findOne.mockResolvedValue(task);

      await expect(service.findOne(userId, 'task-1')).resolves.toBe(task);
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

    it('cancela a definição somente se ela pertencer ao usuário', async () => {
      const task = { id: 'task-1', userId };
      tasksRepo.findOne.mockResolvedValue(task);

      await service.remove(userId, 'task-1');

      expect(tasksRepo.softRemove).toHaveBeenCalledWith(task);
    });

    it('não cancela a definição de outro usuário', async () => {
      tasksRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('outro-usuario', 'task-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(tasksRepo.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    let txQb: ReturnType<typeof createQueryBuilderMock>;

    const makeTask = (overrides: Partial<Task> = {}) =>
      ({
        id: 'task-1',
        userId,
        title: 'Treinar',
        description: 'Descrição',
        type: TaskType.CUSTOM,
        recurrence: TaskRecurrence.RECURRING,
        startDate: '2026-10-12',
        daysOfWeek: [1, 3, 5],
        ...overrides,
      }) as Task;

    const occurrence = (
      id: string,
      referenceDate: string,
      completed = false,
    ) => ({
      id,
      referenceDate,
      completions: completed ? [{ id: `completion-${id}` }] : [],
    });

    beforeEach(() => {
      txQb = createQueryBuilderMock();
      txOccurrencesRepo.createQueryBuilder.mockReturnValue(txQb);
      txTasksRepo.save.mockImplementation((value: Task) =>
        Promise.resolve(value),
      );
    });

    it('atualiza o título, mantém a descrição e não mexe nas ocorrências', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());

      const result = await service.update(
        userId,
        'task-1',
        { title: 'Novo título' },
        today,
      );

      expect(result).toMatchObject({
        title: 'Novo título',
        description: 'Descrição',
        type: TaskType.CUSTOM,
        daysOfWeek: [1, 3, 5],
      });
      expect(txOccurrencesRepo.find).not.toHaveBeenCalled();
      expect(txOccurrencesRepo.delete).not.toHaveBeenCalled();
      expect(txQb.insert).not.toHaveBeenCalled();
    });

    it('limpa a descrição quando ela é enviada como null', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());
      const dto = { description: null } as unknown as UpdateTaskDto;

      const result = await service.update(userId, 'task-1', dto, today);

      expect(result.description).toBeNull();
    });

    it('não atualiza a definição de outro usuário', async () => {
      tasksRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('outro-usuario', 'task-1', { title: 'x' }, today),
      ).rejects.toThrow(NotFoundException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejeita virar customizada sem informar os dias', async () => {
      tasksRepo.findOne.mockResolvedValue(
        makeTask({ type: TaskType.DAILY, daysOfWeek: ALL_DAYS }),
      );

      await expect(
        service.update(userId, 'task-1', { type: TaskType.CUSTOM }, today),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejeita esvaziar os dias de uma tarefa customizada', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());

      await expect(
        service.update(userId, 'task-1', { daysOfWeek: [] }, today),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('grava os sete dias quando a tarefa vira diária', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());

      const result = await service.update(
        userId,
        'task-1',
        { type: TaskType.DAILY },
        today,
      );

      expect(result.daysOfWeek).toEqual(ALL_DAYS);
    });

    it('remove de verdade as futuras inválidas sem conclusão e preserva as demais', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());
      txOccurrencesRepo.find.mockResolvedValue([
        occurrence('mon', '2026-10-12'), // passada: preservada
        occurrence('wed', '2026-10-14'), // passada: preservada
        occurrence('fri', '2026-10-16'), // continua válida: preservada
        occurrence('next-mon', '2026-10-19'), // futura e inválida: removida
        occurrence('next-wed', '2026-10-21', true), // inválida, mas concluída: preservada
      ]);

      await service.update(userId, 'task-1', { daysOfWeek: [5] }, today);

      expect(txOccurrencesRepo.find).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        withDeleted: true,
        relations: { completions: true },
      });
      expect(txOccurrencesRepo.delete).toHaveBeenCalledWith(['next-mon']);
      expect(txQb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-16' },
      ]);
      expect(txQb.orIgnore).toHaveBeenCalled();
    });

    it('ao virar semanal, troca as ocorrências futuras pela da segunda-feira', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask());
      txOccurrencesRepo.find.mockResolvedValue([
        occurrence('fri', '2026-10-16'),
      ]);

      const result = await service.update(
        userId,
        'task-1',
        { type: TaskType.WEEKLY },
        today,
      );

      expect(result.daysOfWeek).toBeNull();
      expect(txOccurrencesRepo.delete).toHaveBeenCalledWith(['fri']);
      expect(txQb.values).toHaveBeenCalledWith([
        { taskId: 'task-1', referenceDate: '2026-10-12' },
      ]);
    });

    it('não cria ocorrências na semana atual para tarefa ONCE de outra semana', async () => {
      tasksRepo.findOne.mockResolvedValue(
        makeTask({
          recurrence: TaskRecurrence.ONCE,
          startDate: '2026-10-05',
        }),
      );

      await service.update(
        userId,
        'task-1',
        { type: TaskType.DAILY },
        today,
      );

      expect(txQb.insert).not.toHaveBeenCalled();
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

    function occurrenceNotFound() {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);
    }

    const uniqueViolation = () =>
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );

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

    it('converte a violação de unicidade do banco em Conflict (corrida)', async () => {
      occurrenceQueryBuilder();
      completionsRepo.findOne.mockResolvedValue(null);
      completionsRepo.save.mockRejectedValue(uniqueViolation());

      await expect(
        service.completeOccurrence(userId, occurrence.id),
      ).rejects.toThrow(ConflictException);
    });

    it('repassa erros inesperados ao concluir', async () => {
      occurrenceQueryBuilder();
      completionsRepo.findOne.mockResolvedValue(null);
      completionsRepo.save.mockRejectedValue(new Error('falha de conexão'));

      await expect(
        service.completeOccurrence(userId, occurrence.id),
      ).rejects.toThrow('falha de conexão');
    });

    it('rejeita ocorrência de outro usuário ao concluir', async () => {
      occurrenceNotFound();

      await expect(
        service.completeOccurrence('outro-usuario', occurrence.id),
      ).rejects.toThrow(NotFoundException);
      expect(completionsRepo.save).not.toHaveBeenCalled();
    });

    it('desfaz a conclusão somente após validar o proprietário', async () => {
      occurrenceQueryBuilder();

      await service.uncompleteOccurrence(userId, occurrence.id);

      expect(completionsRepo.delete).toHaveBeenCalledWith({
        occurrenceId: occurrence.id,
      });
    });

    it('rejeita ocorrência de outro usuário ao desfazer', async () => {
      occurrenceNotFound();

      await expect(
        service.uncompleteOccurrence('outro-usuario', occurrence.id),
      ).rejects.toThrow(NotFoundException);
      expect(completionsRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('remoção de ocorrências', () => {
    it('remove somente a ocorrência solicitada', async () => {
      const qb = createQueryBuilderMock();
      const occurrence = { id: 'occ-1', task: { userId } };
      qb.getOne.mockResolvedValue(occurrence);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await service.removeOccurrence(userId, occurrence.id);

      expect(occurrencesRepo.softRemove).toHaveBeenCalledWith(occurrence);
    });

    it('rejeita ocorrência de outro usuário', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      occurrencesRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.removeOccurrence('outro-usuario', 'occ-1'),
      ).rejects.toThrow(NotFoundException);
      expect(occurrencesRepo.softRemove).not.toHaveBeenCalled();
    });
  });
});