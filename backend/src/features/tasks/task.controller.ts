import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { DateQueryDto } from './dto/date-query.dto';
import { TaskResponseDto } from './dto/response-task.dto';
import { TaskDefinitionResponseDto } from './dto/task-definition.dto';
import { TasksService } from './task.service';
import { UpdateTaskDto } from './dto/update-task.dto';

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



    @Get()
    @ApiOkResponse({
        type: TaskDefinitionResponseDto,
        isArray: true,
        description: 'Lista as definições de tarefas do usuário autenticado',
    })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async findAll(
        @CurrentUserId() userId: string,
    ): Promise<TaskDefinitionResponseDto[]> {
        return (await this.tasksService.findAll(userId)).map((task) =>
        TaskDefinitionResponseDto.fromEntity(task),
        );
    }



    @Patch(':taskId')
    @ApiParam({
        name: 'taskId',
        description: 'ID da definição da tarefa',
        format: 'uuid',
    })
    @ApiOkResponse({
        type: TaskDefinitionResponseDto,
        description: 'Definição da tarefa atualizada com sucesso',
    })
    @ApiBadRequestResponse({ description: 'Dados inválidos' })
    @ApiNotFoundResponse({ description: 'Tarefa não encontrada' })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async update(
        @CurrentUserId() userId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: UpdateTaskDto,
        @Query() { date }: DateQueryDto,
        ): Promise<TaskDefinitionResponseDto> {
        return TaskDefinitionResponseDto.fromEntity(
            await this.tasksService.update(userId, taskId, dto, date),
        );
    }



    @Delete(':taskId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({
        name: 'taskId',
        description: 'ID da definição da tarefa',
        format: 'uuid',
    })
    @ApiNoContentResponse({ description: 'Tarefa cancelada com sucesso' })
    @ApiNotFoundResponse({ description: 'Tarefa não encontrada' })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async remove(
        @CurrentUserId() userId: string,
        @Param('taskId') taskId: string,
    ): Promise<void> {
        await this.tasksService.remove(userId, taskId);
    }



    @Post('occurrences/:occurrenceId/complete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({
        name: 'occurrenceId',
        description: 'ID da ocorrência a concluir',
        format: 'uuid',
    })
    @ApiNoContentResponse({ description: 'Ocorrência concluída com sucesso' })
    @ApiConflictResponse({ description: 'Ocorrência já concluída' })
    @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async complete(
        @CurrentUserId() userId: string,
        @Param('occurrenceId') occurrenceId: string,
    ): Promise<void> {
        await this.tasksService.completeOccurrence(userId, occurrenceId);
    }



    @Delete('occurrences/:occurrenceId/completion')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({
        name: 'occurrenceId',
        description: 'ID da ocorrência cuja conclusão será desfeita',
        format: 'uuid',
    })
    @ApiNoContentResponse({ description: 'Conclusão desfeita com sucesso' })
    @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async uncomplete(
        @CurrentUserId() userId: string,
        @Param('occurrenceId') occurrenceId: string,
    ): Promise<void> {
        await this.tasksService.uncompleteOccurrence(userId, occurrenceId);
    }



    @Delete('occurrences/:occurrenceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({
        name: 'occurrenceId',
        description: 'ID da ocorrência a excluir',
        format: 'uuid',
    })
    @ApiNoContentResponse({ description: 'Ocorrência excluída com sucesso' })
    @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
    @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
    async removeOccurrence(
        @CurrentUserId() userId: string,
        @Param('occurrenceId') occurrenceId: string,
    ): Promise<void> {
        await this.tasksService.removeOccurrence(userId, occurrenceId);
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