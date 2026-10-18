import type { Occurrence, TaskRecurrence, TaskType } from './types';

export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const TYPE_LABEL: Record<TaskType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  custom: 'Personalizada',
};

export const RECURRENCE_LABEL: Record<TaskRecurrence, string> = {
  ONCE: 'Só desta vez',
  RECURRING: 'Todas as semanas',
};

export function describeDays(
  occurrence: Pick<Occurrence, 'type' | 'daysOfWeek'>,
): string {
  if (occurrence.type === 'weekly') return 'Qualquer dia da semana';
  if (occurrence.type === 'daily') return 'Todos os dias';
  return (occurrence.daysOfWeek ?? []).map((d) => WEEKDAY_NAMES[d]).join(', ');
}
