import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { DateQueryDto } from './dto/date-query.dto';
import { TaskResponseDto } from './dto/response-task.dto';
import { TaskDefinitionResponseDto } from './dto/task-definition.dto';
import { TasksService } from './task.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiCreatedResponse({
    type: TaskDefinitionResponseDto,
    description: 'Definição da tarefa criada com sucesso',
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTaskDto,
    @Query() { date }: DateQueryDto,
  ): Promise<TaskDefinitionResponseDto> {
    const task = await this.tasksService.create(userId, dto, date);

    return TaskDefinitionResponseDto.fromEntity(task);
  }

  @Get('today')
  @ApiOkResponse({
    type: TaskResponseDto,
    isArray: true,
    description:
      'Lista as ocorrências das tarefas do dia do usuário autenticado',
  })
  @ApiBadRequestResponse({ description: 'Data inválida' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async findToday(
    @CurrentUserId() userId: string,
    @Query() { date }: DateQueryDto,
  ): Promise<TaskResponseDto[]> {
    const occurrences = await this.tasksService.findToday(userId, date);

    return occurrences.map((occurrence) =>
      TaskResponseDto.fromEntity(occurrence),
    );
  }

  @Get('weekly')
  @ApiOkResponse({
    type: TaskResponseDto,
    isArray: true,
    description: 'Lista as ocorrências das tarefas semanais da semana',
  })
  @ApiBadRequestResponse({ description: 'Data inválida' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async findWeekly(
    @CurrentUserId() userId: string,
    @Query() { date }: DateQueryDto,
  ): Promise<TaskResponseDto[]> {
    const occurrences = await this.tasksService.findWeekly(userId, date);

    return occurrences.map((occurrence) =>
      TaskResponseDto.fromEntity(occurrence),
    );
  }
}