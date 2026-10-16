// src/features/tasks/tasks.controller.spec.ts
import { Test } from '@nestjs/testing';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskType } from '../task-type.enum';
import { TasksService } from '../task.service';
import { TasksController } from '../task.controller';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    controller = module.get(TasksController);
  });

  it('cria a tarefa para o usuário e devolve o DTO de resposta', async () => {
    const createdAt = new Date('2026-10-15T12:00:00Z');
    tasksService.create.mockResolvedValue({
      id: 'task-1',
      title: 'Beber água',
      description: undefined,
      type: TaskType.DAILY,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      userId: 'user-1',
      createdAt,
    });
    const dto: CreateTaskDto = { title: 'Beber água', type: TaskType.DAILY };

    const result = await controller.create('user-1', dto);

    expect(tasksService.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual({
      id: 'task-1',
      title: 'Beber água',
      description: null,
      type: TaskType.DAILY,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt,
    });
  });
});