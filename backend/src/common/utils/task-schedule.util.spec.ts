import { TaskType } from '../../features/tasks/task-type.enum';
import { getWeekOccurrenceDates } from './task-schedule.util';

describe('getWeekOccurrenceDates', () => {
  const weekStart = '2026-10-12'; // segunda-feira

  it('devolve só a segunda-feira para tarefa semanal', () => {
    expect(getWeekOccurrenceDates(TaskType.WEEKLY, null, weekStart)).toEqual([
      '2026-10-12',
    ]);
  });

  it('devolve os sete dias para tarefa diária', () => {
    const dates = getWeekOccurrenceDates(TaskType.DAILY, null, weekStart);

    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-10-12');
    expect(dates[6]).toBe('2026-10-18');
  });

  it('devolve só os dias escolhidos para tarefa customizada', () => {
    expect(
      getWeekOccurrenceDates(TaskType.CUSTOM, [1, 3, 5], weekStart),
    ).toEqual(['2026-10-12', '2026-10-14', '2026-10-16']);
  });

  it('inclui o domingo no fim da semana', () => {
    expect(getWeekOccurrenceDates(TaskType.CUSTOM, [0], weekStart)).toEqual([
      '2026-10-18',
    ]);
  });

  it('devolve lista vazia quando a customizada não tem dias', () => {
    expect(getWeekOccurrenceDates(TaskType.CUSTOM, null, weekStart)).toEqual(
      [],
    );
  });
});