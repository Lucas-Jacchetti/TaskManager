import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskList } from './TaskList';
import type { Occurrence } from '../types';

const occurrence: Occurrence = {
  id: 'occurrence-1',
  taskId: 'task-1',
  title: 'Beber água',
  description: null,
  type: 'custom',
  recurrence: 'ONCE',
  daysOfWeek: [1],
  referenceDate: '2026-10-19',
  createdAt: '2026-10-01T00:00:00.000Z',
  completed: false,
};

describe('TaskList', () => {
  it('renderiza o texto vazio quando não há tarefas', () => {
    render(<TaskList items={[]} emptyText="Sem tarefas" onToggle={vi.fn()} />);
    expect(screen.getByText('Sem tarefas')).toBeInTheDocument();
  });

  it('renderiza todas as tarefas e encaminha o toggle', () => {
    const onToggle = vi.fn();
    render(<TaskList items={[occurrence]} emptyText="Sem tarefas" onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(screen.getByText('Beber água')).toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith(occurrence);
  });
});
