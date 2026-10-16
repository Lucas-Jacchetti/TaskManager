import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  getDayOfWeek,
  getServerToday,
  getWeekStart,
} from '../../common/utils/date.util';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './task.entity';
import { TaskRecurrence } from './task-recurrence.enum';
import { TaskType } from './task-type.enum';
import { TaskOccurrence } from './task-ocurrence.entity';
import { getWeekOccurrenceDates } from '../../common/utils/task-schedule.util';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,

    @InjectRepository(TaskOccurrence)
    private readonly occurrencesRepo: Repository<TaskOccurrence>,

    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreateTaskDto,
    today: string = getServerToday(),
  ): Promise<Task> {
    const daysOfWeek = this.resolveDaysOfWeek(dto);

    return this.dataSource.transaction(async (manager) => {
      const tasksRepo = manager.getRepository(Task);
      const occurrencesRepo = manager.getRepository(TaskOccurrence);

      const task = await tasksRepo.save(
        tasksRepo.create({
          title: dto.title,
          description: dto.description,
          type: dto.type,
          recurrence: dto.recurrence,
          daysOfWeek,
          userId,
        }),
      );

      const referenceDates = getWeekOccurrenceDates(
        task.type,
        daysOfWeek,
        getWeekStart(today),
      ).filter((date) => task.type === TaskType.WEEKLY || date >= today);

      if (referenceDates.length > 0) {
        await occurrencesRepo.save(
          referenceDates.map((referenceDate) =>
            occurrencesRepo.create({ taskId: task.id, referenceDate }),
          ),
        );
      }

      return task;
    });
  }

  async findToday(
    userId: string,
    today: string = getServerToday(),
  ): Promise<TaskOccurrence[]> {
    await this.ensureOccurrencesForWeek(userId, getWeekStart(today));

    return this.occurrencesRepo
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .where('task.userId = :userId', { userId })
      .andWhere('occurrence.referenceDate = :today', { today })
      .andWhere(
        '(task.type = :daily OR ' +
          '(task.type = :custom AND :day = ANY(task.daysOfWeek)))',
        {
          daily: TaskType.DAILY,
          custom: TaskType.CUSTOM,
          day: getDayOfWeek(today),
        },
      )
      .getMany();
  }

  async findWeekly(
    userId: string,
    today: string = getServerToday(),
  ): Promise<TaskOccurrence[]> {
    const weekStart = getWeekStart(today);
    await this.ensureOccurrencesForWeek(userId, weekStart);

    return this.occurrencesRepo
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.type = :weekly', { weekly: TaskType.WEEKLY })
      .andWhere('occurrence.referenceDate = :weekStart', { weekStart })
      .getMany();
  }

  private async ensureOccurrencesForWeek(
    userId: string,
    weekStart: string,
  ): Promise<void> {
    const tasks = await this.tasksRepo.find({
      where: { userId, recurrence: TaskRecurrence.RECURRING },
    });

    const rows = tasks.flatMap((task) =>
      getWeekOccurrenceDates(task.type, task.daysOfWeek ?? null, weekStart).map(
        (referenceDate) => ({ taskId: task.id, referenceDate }),
      ),
    );

    if (rows.length === 0) {
      return;
    }

    await this.occurrencesRepo
      .createQueryBuilder()
      .insert()
      .into(TaskOccurrence)
      .values(rows)
      .orIgnore()
      .execute();
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

        return [...new Set(dto.daysOfWeek)].sort((a, b) => a - b);
    }
  }
}