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
  it('renderiza o menu de opções da tarefa', () => {
    const onDetails = vi.fn();
    const onDelete = vi.fn();
    render(
      <TaskItem
        occurrence={occurrence}
        onToggle={vi.fn()}
        onDetails={onDetails}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Beber água')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    expect(onDetails).toHaveBeenCalledWith(occurrence);
    expect(onDelete).toHaveBeenCalledWith(occurrence);
  });

  it('notifica quando a tarefa é alternada', () => {
    const onToggle = vi.fn();
    render(
      <TaskItem
        occurrence={occurrence}
        onToggle={onToggle}
        onDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(onToggle).toHaveBeenCalledWith(occurrence);
  });

  it('renderiza uma tarefa concluída', () => {
    render(
      <TaskItem
        occurrence={{ ...occurrence, completed: true }}
        onToggle={vi.fn()}
        onDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Desmarcar tarefa' })).toBeInTheDocument();
  });
});
