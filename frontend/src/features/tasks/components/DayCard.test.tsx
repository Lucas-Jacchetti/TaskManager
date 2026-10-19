import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DayCard } from './DayCard';
import type { Occurrence } from '../types';

const occurrence: Occurrence = {
  id: 'occurrence-1',
  taskId: 'task-1',
  title: 'Beber água',
  description: null,
  type: 'daily',
  recurrence: 'RECURRING',
  daysOfWeek: null,
  referenceDate: '2026-10-19',
  createdAt: '2026-10-01T00:00:00.000Z',
  completed: true,
};

describe('DayCard', () => {
  it('renderiza o dia atual, a tarefa e o progresso', () => {
    render(
      <DayCard
        date="2026-10-19"
        isToday
        items={[occurrence]}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('19/10')).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText('1 de 1 concluída')).toBeInTheDocument();
  });

  it('renderiza o estado de dia livre', () => {
    render(
      <DayCard
        date="2026-10-20"
        isToday={false}
        items={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('Ter')).toBeInTheDocument();
    expect(screen.getByText('Seu dia está livre')).toBeInTheDocument();
    expect(screen.getByText('Sem tarefas')).toBeInTheDocument();
  });

  it('encaminha a conclusão da tarefa', () => {
    const onToggle = vi.fn();
    render(
      <DayCard
        date="2026-10-19"
        isToday={false}
        items={[occurrence]}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Desmarcar tarefa' }));
    expect(onToggle).toHaveBeenCalledWith(occurrence);
  });
});
