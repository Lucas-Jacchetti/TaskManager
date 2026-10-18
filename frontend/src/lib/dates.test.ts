import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  dayMonth,
  formatWeekRange,
  getDayOfWeek,
  getWeekStart,
  today,
} from './dates';

afterEach(() => {
  vi.useRealTimers();
});

describe('addDays', () => {
  it('avança dentro do mês', () => {
    expect(addDays('2026-10-16', 3)).toBe('2026-10-19');
  });

  it('vira o mês', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });

  it('vira o ano', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('aceita valores negativos', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('getDayOfWeek', () => {
  it('devolve 5 para uma sexta-feira', () => {
    expect(getDayOfWeek('2026-10-16')).toBe(5);
  });

  it('devolve 0 para um domingo', () => {
    expect(getDayOfWeek('2026-10-18')).toBe(0);
  });
});

describe('getWeekStart', () => {
  it('devolve a segunda-feira da semana de uma sexta', () => {
    expect(getWeekStart('2026-10-16')).toBe('2026-10-12');
  });

  it('mantém a data quando já é segunda-feira', () => {
    expect(getWeekStart('2026-10-12')).toBe('2026-10-12');
  });

  it('trata o domingo como último dia da semana', () => {
    expect(getWeekStart('2026-10-18')).toBe('2026-10-12');
  });

  it('atravessa a virada de ano', () => {
    expect(getWeekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('today', () => {
  it('formata a data local como YYYY-MM-DD', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16, 23, 30));

    expect(today()).toBe('2026-10-16');
  });
});

describe('formatação', () => {
  it('dayMonth mostra dia e mês', () => {
    expect(dayMonth('2026-10-05')).toBe('05/10');
  });

  it('formatWeekRange mostra a faixa da segunda ao domingo', () => {
    expect(formatWeekRange('2026-10-12')).toBe('12/10 – 18/10');
  });
});