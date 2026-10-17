import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
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
import { TaskCompletion } from './task-completion.entity';
import { getWeekOccurrenceDates } from '../../common/utils/task-schedule.util';
import { UpdateTaskDto } from './dto/update-task.dto';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,

    @InjectRepository(TaskOccurrence)
    private readonly occurrencesRepo: Repository<TaskOccurrence>,

    @InjectRepository(TaskCompletion)
    private readonly completionsRepo: Repository<TaskCompletion>,

    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreateTaskDto,
    today: string = getServerToday(),
  ): Promise<Task> {
    const daysOfWeek = this.resolveDaysOfWeek(dto.type, dto.daysOfWeek);

    return this.dataSource.transaction(async (manager) => {
      const tasksRepo = manager.getRepository(Task);
      const occurrencesRepo = manager.getRepository(TaskOccurrence);

      const task = await tasksRepo.save(
        tasksRepo.create({
          title: dto.title,
          description: dto.description,
          type: dto.type,
          recurrence: dto.recurrence,
          startDate: today,
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
    await this.ensureOccurrencesForWeek(userId, getWeekStart(today), today);

    return this.occurrencesRepo
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .leftJoinAndSelect('occurrence.completions', 'completion')
      .where('task.userId = :userId', { userId })
      .andWhere('task.deletedAt IS NULL')
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
    await this.ensureOccurrencesForWeek(userId, weekStart, today);

    return this.occurrencesRepo
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .leftJoinAndSelect('occurrence.completions', 'completion')
      .where('task.userId = :userId', { userId })
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.type = :weekly', { weekly: TaskType.WEEKLY })
      .andWhere('occurrence.referenceDate = :weekStart', { weekStart })
      .getMany();
  }

  async findAll(userId: string): Promise<Task[]> {
    return this.tasksRepo.find({ where: { userId } });
  }

  async findOne(userId: string, taskId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id: taskId, userId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async update(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
    today: string = getServerToday(),
  ): Promise<Task> {
    const task = await this.findOne(userId, taskId);

    const type = dto.type ?? task.type;
    const recurrence = dto.recurrence ?? task.recurrence;
    const description = Object.prototype.hasOwnProperty.call(dto, 'description')
      ? dto.description
      : task.description;

    if (
      type === TaskType.CUSTOM &&
      task.type !== TaskType.CUSTOM &&
      dto.daysOfWeek === undefined
    ) {
      throw new BadRequestException(
        'Ao mudar para customizada, informe os dias da semana',
      );
    }

    const daysOfWeek = this.resolveDaysOfWeek(
      type,
      dto.daysOfWeek ?? task.daysOfWeek,
    );
    const scheduleChanged =
      dto.type !== undefined ||
      dto.daysOfWeek !== undefined ||
      dto.recurrence !== undefined;

    return this.dataSource.transaction(async (manager) => {
      Object.assign(task, {
        title: dto.title ?? task.title,
        description,
        type,
        recurrence,
        daysOfWeek,
      });
      const updatedTask = await manager.getRepository(Task).save(task);

      if (scheduleChanged) {
        await this.reconcileCurrentWeek(manager, updatedTask, today);
      }

      return updatedTask;
    });
  }

  private async reconcileCurrentWeek(manager: EntityManager, task: Task, today: string,): Promise<void> {
    const occurrencesRepo = manager.getRepository(TaskOccurrence);
    const weekStart = getWeekStart(today);

    const activeThisWeek =
      task.recurrence === TaskRecurrence.RECURRING ||
      getWeekStart(task.startDate) === weekStart;

    const validDates = new Set(
      activeThisWeek
        ? getWeekOccurrenceDates(
            task.type,
            task.daysOfWeek ?? null,
            weekStart,
          ).filter((date) => task.type === TaskType.WEEKLY || date >= today)
        : [],
    );

    const existing = await occurrencesRepo.find({
      where: { taskId: task.id },
      withDeleted: true,
      relations: { completions: true },
    });

    const staleIds = existing
      .filter(
        (occurrence) =>
          occurrence.referenceDate >= today &&
          !validDates.has(occurrence.referenceDate) &&
          !(occurrence.completions?.length ?? 0),
      )
      .map((occurrence) => occurrence.id);

    if (staleIds.length > 0) {
      await occurrencesRepo.delete(staleIds); 
    }

    if (validDates.size > 0) {
      await occurrencesRepo
        .createQueryBuilder()
        .insert()
        .into(TaskOccurrence)
        .values(
          [...validDates].map((referenceDate) => ({
            taskId: task.id,
            referenceDate,
          })),
        )
        .orIgnore() 
        .execute();
    }
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.findOne(userId, taskId);
    await this.tasksRepo.softRemove(task);
  }

  async completeOccurrence(userId: string, occurrenceId: string): Promise<void> {
    const occurrence = await this.findOccurrenceForUser(userId, occurrenceId);
    const existing = await this.completionsRepo.findOne({
      where: { occurrenceId: occurrence.id },
    });
    if (existing) {
      throw new ConflictException('Ocorrência já concluída');
    }
    try {
      await this.completionsRepo.save(
        this.completionsRepo.create({ occurrenceId: occurrence.id }),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError &&
        typeof error.driverError === 'object' &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Ocorrência já concluída');
      }
      throw error;
    }
  }

  async uncompleteOccurrence(userId: string, occurrenceId: string,): Promise<void> {
    const occurrence = await this.findOccurrenceForUser(userId, occurrenceId);
    await this.completionsRepo.delete({ occurrenceId: occurrence.id });
  }

  async removeOccurrence(userId: string, occurrenceId: string): Promise<void> {
    const occurrence = await this.findOccurrenceForUser(userId, occurrenceId);
    await this.occurrencesRepo.softRemove(occurrence);
  }

  private async findOccurrenceForUser(userId: string, occurrenceId: string): Promise<TaskOccurrence> {
    const occurrence = await this.occurrencesRepo
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .where('occurrence.id = :occurrenceId', { occurrenceId })
      .andWhere('task.userId = :userId', { userId })
      .andWhere('task.deletedAt IS NULL')
      .getOne();
    if (!occurrence) {
      throw new NotFoundException('Ocorrência não encontrada');
    }
    return occurrence;
  }

  private async ensureOccurrencesForWeek(userId: string, weekStart: string, date: string): Promise<void> {
    const tasks = await this.tasksRepo.find({
      where: { userId, recurrence: TaskRecurrence.RECURRING },
    });

    const rows = tasks.flatMap((task) => {
      if (weekStart < getWeekStart(task.startDate)) {
        return [];
      }

      return getWeekOccurrenceDates(
        task.type,
        task.daysOfWeek ?? null,
        weekStart,
      )
        .filter(
          (referenceDate) =>
            task.type === TaskType.WEEKLY ||
            (referenceDate >= task.startDate && referenceDate >= date),
        )
        .map((referenceDate) => ({ taskId: task.id, referenceDate }));
    });

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

  private resolveDaysOfWeek(type: TaskType, daysOfWeek?: number[] | null,): number[] | null {
    switch (type) {
      case TaskType.DAILY:
        return [...ALL_DAYS];

      case TaskType.WEEKLY:
        return null;

      case TaskType.CUSTOM:
        if (!daysOfWeek?.length) {
          throw new BadRequestException(
            'Tarefas customizadas exigem ao menos um dia da semana',
          );
        }

        if (daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
          throw new BadRequestException('Dia da semana inválido');
        }

        return [...new Set(daysOfWeek)].sort((a, b) => a - b);
    }
  }
}