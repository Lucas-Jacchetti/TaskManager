import { Test } from '@nestjs/testing';
import { TasksController } from '../task.controller';
import { TaskType } from '../task-type.enum';
import { TaskRecurrence } from '../task-recurrence.enum';
import { TasksService } from '../task.service';
import { CreateTaskDto } from '../dto/create-task.dto';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    create: jest.fn(),
    findToday: jest.fn(),
    findWeekly: jest.fn(),
  };

  const createdAt = new Date('2026-10-16T12:00:00Z');
  const task = {
    id: 'task-1',
    title: 'Beber água',
    description: undefined,
    type: TaskType.DAILY,
    recurrence: TaskRecurrence.ONCE,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    createdAt,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    controller = module.get(TasksController);
  });

  it('cria a tarefa para o usuário e devolve a definição', async () => {
    tasksService.create.mockResolvedValue(task);
    const dto: CreateTaskDto = {
      title: 'Beber água',
      type: TaskType.DAILY,
      recurrence: TaskRecurrence.ONCE,
    };

    const result = await controller.create('user-1', dto, {
      date: '2026-10-16',
    });

    expect(tasksService.create).toHaveBeenCalledWith(
      'user-1',
      dto,
      '2026-10-16',
    );
    expect(result).toEqual({ ...task, description: null });
  });

  it('lista as ocorrências de hoje no formato de resposta', async () => {
    tasksService.findToday.mockResolvedValue([
      { id: 'occ-1', referenceDate: '2026-10-16', createdAt, task },
    ]);

    const result = await controller.findToday('user-1', {
      date: '2026-10-16',
    });

    expect(tasksService.findToday).toHaveBeenCalledWith(
      'user-1',
      '2026-10-16',
    );
    expect(result).toEqual([
      {
        id: 'occ-1',
        taskId: 'task-1',
        title: 'Beber água',
        description: null,
        type: TaskType.DAILY,
        recurrence: TaskRecurrence.ONCE,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        referenceDate: '2026-10-16',
        createdAt,
      },
    ]);
  });

  it('lista as ocorrências semanais usando a data do servidor quando não há date', async () => {
    tasksService.findWeekly.mockResolvedValue([]);

    const result = await controller.findWeekly('user-1', {});

    expect(tasksService.findWeekly).toHaveBeenCalledWith('user-1', undefined);
    expect(result).toEqual([]);
  });
});