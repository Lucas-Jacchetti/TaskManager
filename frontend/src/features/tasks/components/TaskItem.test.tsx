import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskItem } from './TaskItem';
import type { Occurrence } from '../types';

const occurrence: Occurrence = {
  id: 'occurrence-1',
  taskId: 'task-1',
  title: 'Beber água',
  description: 'Oito copos por dia',
  type: 'daily',
  recurrence: 'RECURRING',
  daysOfWeek: null,
  referenceDate: '2026-10-19',
  createdAt: '2026-10-01T00:00:00.000Z',
  completed: false,
};

describe('TaskItem', () => {
  it('renderiza a tarefa e alterna os detalhes', () => {
    render(<TaskItem occurrence={occurrence} onToggle={vi.fn()} />);

    expect(screen.getByText('Beber água')).toBeInTheDocument();
    expect(screen.queryByText('Oito copos por dia')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Detalhes' }));
    expect(screen.getByText('Oito copos por dia')).toBeInTheDocument();
    expect(screen.getByText('Diária')).toBeInTheDocument();
    expect(screen.getByText('Todas as semanas')).toBeInTheDocument();
  });

  it('notifica quando a tarefa é alternada', () => {
    const onToggle = vi.fn();
    render(<TaskItem occurrence={occurrence} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(onToggle).toHaveBeenCalledWith(occurrence);
  });

  it('renderiza uma tarefa concluída', () => {
    render(
      <TaskItem
        occurrence={{ ...occurrence, completed: true }}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Desmarcar tarefa' })).toBeInTheDocument();
  });
});
