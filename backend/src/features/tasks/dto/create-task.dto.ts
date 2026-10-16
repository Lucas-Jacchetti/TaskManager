import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskType } from '../task-type.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Beber água' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: '2 litros ao longo do dia' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: TaskType, example: TaskType.CUSTOM })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3, 5],
    description:
      'Dias da semana (0 = domingo ... 6 = sábado). Obrigatório apenas para type=custom; ignorado nos demais.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];
}