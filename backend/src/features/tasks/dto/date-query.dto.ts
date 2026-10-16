import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, Matches } from 'class-validator';

export class DateQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-16',
    description:
      'Data local do cliente (YYYY-MM-DD). Se omitida, usa a data do servidor.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD',
  })
  @IsISO8601({ strict: true })
  date?: string;
}