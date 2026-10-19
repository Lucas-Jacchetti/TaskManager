import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekNav } from './WeekNav';

describe('WeekNav', () => {
  it('renderiza o intervalo e navega entre semanas', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <WeekNav
        weekStart="2026-10-12"
        canGoNext
        onPrev={onPrev}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('12/10 – 18/10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próxima semana' }));
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('desabilita a próxima semana quando o limite é atingido', () => {
    render(
      <WeekNav
        weekStart="2026-10-12"
        canGoNext={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Próxima semana' })).toBeDisabled();
  });
});
