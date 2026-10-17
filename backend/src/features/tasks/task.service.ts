import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
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
  ): Promise<Task> {
    const task = await this.findOne(userId, taskId);
    const type = dto.type ?? task.type;
    const description = Object.prototype.hasOwnProperty.call(
      dto,
      'description',
    )
      ? dto.description
      : task.description;
    const daysOfWeek = this.resolveDaysOfWeek({
      title: dto.title ?? task.title,
      description,
      type,
      recurrence: dto.recurrence ?? task.recurrence,
      daysOfWeek: dto.daysOfWeek ?? task.daysOfWeek ?? undefined,
    });
    const scheduleChanged =
      dto.type !== undefined || dto.daysOfWeek !== undefined;
    const recurrenceChanged = dto.recurrence !== undefined;

    Object.assign(task, {
      title: dto.title ?? task.title,
      description,
      type,
      recurrence: dto.recurrence ?? task.recurrence,
      daysOfWeek,
    });
    const updatedTask = await this.tasksRepo.save(task);

    if (scheduleChanged || recurrenceChanged) {
      await this.reconcileFutureOccurrences(updatedTask);
    }

    return updatedTask;
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

  private async ensureOccurrencesForWeek(userId: string, weekStart: string, today: string,): Promise<void> {
    const tasks = await this.tasksRepo.find({
      where: { userId, recurrence: TaskRecurrence.RECURRING },
    });

    const rows = tasks.flatMap((task) => {
      const startDate = task.startDate;
      return getWeekOccurrenceDates(
        task.type,
        task.daysOfWeek ?? null,
        weekStart,
      )
        .filter(
          (referenceDate) =>
            referenceDate >= weekStart &&
            (weekStart !== getWeekStart(today) ||
              task.type === TaskType.WEEKLY ||
              !startDate ||
              referenceDate >= today) &&
            (!startDate || task.type === TaskType.WEEKLY || referenceDate >= startDate),
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

  private async reconcileFutureOccurrences(task: Task): Promise<void> {
    const today = getServerToday();
    const occurrences = await this.occurrencesRepo.find({
      where: { taskId: task.id },
      relations: { completions: true },
    });
    const futureIncomplete = occurrences.filter(
      (occurrence) =>
        occurrence.referenceDate >= today &&
        !(occurrence.completions?.length ?? 0),
    );

    if (futureIncomplete.length > 0) {
      await this.occurrencesRepo.softRemove(futureIncomplete);
    }

    if (task.recurrence === TaskRecurrence.RECURRING) {
      await this.ensureOccurrencesForWeek(
        task.userId,
        getWeekStart(today),
        today,
      );
    }
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

        if (
          dto.daysOfWeek.some(
            (day) => !Number.isInteger(day) || day < 0 || day > 6,
          )
        ) {
          throw new BadRequestException('Dia da semana inválido');
        }

        return [...new Set(dto.daysOfWeek)].sort((a, b) => a - b);
    }
  }
}