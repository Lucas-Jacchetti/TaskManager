import { describe, expect, it } from 'vitest';
import {
  RECURRENCE_LABEL,
  TYPE_LABEL,
  WEEKDAY_NAMES,
  describeDays,
} from './labels';

describe('task labels', () => {
  it('expõe os nomes dos dias e tipos', () => {
    expect(WEEKDAY_NAMES).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    expect(TYPE_LABEL.daily).toBe('Diária');
    expect(TYPE_LABEL.weekly).toBe('Semanal');
    expect(TYPE_LABEL.custom).toBe('Personalizada');
    expect(RECURRENCE_LABEL.ONCE).toBe('Só desta vez');
    expect(RECURRENCE_LABEL.RECURRING).toBe('Todas as semanas');
  });

  it('descreve os dias conforme o tipo da tarefa', () => {
    expect(describeDays({ type: 'weekly', daysOfWeek: null })).toBe(
      'Qualquer dia da semana',
    );
    expect(describeDays({ type: 'daily', daysOfWeek: null })).toBe('Todos os dias');
    expect(describeDays({ type: 'custom', daysOfWeek: [1, 3, 6] })).toBe(
      'Seg, Qua, Sáb',
    );
    expect(describeDays({ type: 'custom', daysOfWeek: null })).toBe('');
  });
});
