import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './task.entity';
import { TaskType } from './task-type.enum';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepo.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      daysOfWeek: this.resolveDaysOfWeek(dto),
      userId,
    });
    return this.tasksRepo.save(task);
  }

  private resolveDaysOfWeek(dto: CreateTaskDto): number[] | null {
    switch (dto.type) {
      case TaskType.DAILY:
        return [...ALL_DAYS];
      case TaskType.WEEKLY:
        return null;
      case TaskType.CUSTOM:
        if (!dto.daysOfWeek?.length) {
          throw new BadRequestException(
            'Tarefas customizadas exigem ao menos um dia da semana',
          );
        }
        return [...dto.daysOfWeek].sort((a, b) => a - b);
    }
  }
}