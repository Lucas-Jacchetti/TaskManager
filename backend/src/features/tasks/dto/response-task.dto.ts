import { ApiProperty } from '@nestjs/swagger';
import { Task } from '../task.entity';
import { TaskType } from '../task-type.enum';

export class TaskResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ enum: TaskType }) type: TaskType;
  @ApiProperty({ type: [Number], nullable: true }) daysOfWeek: number[] | null;
  @ApiProperty() createdAt: Date;

  static fromEntity(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.title = task.title;
    dto.description = task.description ?? null;
    dto.type = task.type;
    dto.daysOfWeek = task.daysOfWeek ?? null;
    dto.createdAt = task.createdAt;
    return dto;
  }
}