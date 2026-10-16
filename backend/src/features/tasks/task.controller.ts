import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './task.service';
import { TaskResponseDto } from './dto/response-task.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'Usuário não identificado' })
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.create(userId, dto);
    return TaskResponseDto.fromEntity(task);
  }
}