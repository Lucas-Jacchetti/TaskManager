
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../task-type.enum';
import { TaskRecurrence } from '../task-recurrence.enum';
import { TaskOccurrence } from '../task-ocurrence.entity';

export class TaskResponseDto {
    @ApiProperty({
        description: 'ID único desta ocorrência',
        format: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'ID da definição original da tarefa',
        format: 'uuid',
    })
    taskId: string;

    @ApiProperty({ example: 'Beber água' })
    title: string;

    @ApiProperty({
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

    @ApiProperty({
        example: '2026-10-16',
        description:
        'Data da ocorrência; para tarefas WEEKLY, representa a segunda-feira da semana.',
    })
    referenceDate: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({
        description: 'Indica se esta ocorrência foi concluída',
    })
    completed: boolean;

    static fromEntity(
        occurrence: TaskOccurrence,
    ): TaskResponseDto {
        const dto = new TaskResponseDto();
        const task = occurrence.task;

        dto.id = occurrence.id;
        dto.taskId = task.id;
        dto.title = task.title;
        dto.description = task.description ?? null;
        dto.type = task.type;
        dto.recurrence = task.recurrence;
        dto.daysOfWeek = task.daysOfWeek ?? null;
        dto.referenceDate = occurrence.referenceDate;
        dto.createdAt = occurrence.createdAt;
        dto.completed = (occurrence.completions?.length ?? 0) > 0;

        return dto;
    }
}
