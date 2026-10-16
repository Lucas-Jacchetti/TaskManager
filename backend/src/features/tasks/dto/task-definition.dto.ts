
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task } from '../task.entity';
import { TaskType } from '../task-type.enum';
import { TaskRecurrence } from '../task-recurrence.enum';

export class TaskDefinitionResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ example: 'Beber água' })
    title: string;

    @ApiPropertyOptional({
        type: String,
        nullable: true,
        example: '2 litros ao longo do dia',
    })
    description: string | null;

    @ApiProperty({ enum: TaskType })
    type: TaskType;

    @ApiProperty({ enum: TaskRecurrence })
    recurrence: TaskRecurrence;

    @ApiProperty({ type: [Number], nullable: true })
    daysOfWeek: number[] | null;

    @ApiProperty()
    createdAt: Date;

    static fromEntity(task: Task): TaskDefinitionResponseDto {
        const dto = new TaskDefinitionResponseDto();

        dto.id = task.id;
        dto.title = task.title;
        dto.description = task.description ?? null;
        dto.type = task.type;
        dto.recurrence = task.recurrence;
        dto.daysOfWeek = task.daysOfWeek ?? null;
        dto.createdAt = task.createdAt;

        return dto;
    }
}
