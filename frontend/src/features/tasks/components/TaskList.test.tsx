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

const detailedOccurrence = {
  ...occurrence,
  description: 'Descrição da tarefa',
};

describe('TaskList', () => {
  it('renderiza o texto vazio quando não há tarefas', () => {
    render(
      <TaskList
        items={[]}
        emptyText="Sem tarefas"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Sem tarefas')).toBeInTheDocument();
  });

  it('renderiza todas as tarefas e encaminha o toggle', () => {
    const onToggle = vi.fn();
    render(
      <TaskList
        items={[occurrence]}
        emptyText="Sem tarefas"
        onToggle={onToggle}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Concluir tarefa' }));
    expect(screen.getByText('Beber água')).toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith(occurrence);
  });

  it('renderiza detalhes no início da lista e encaminha exclusão', () => {
    const onDelete = vi.fn();
    render(
      <TaskList
        items={[detailedOccurrence]}
        emptyText="Sem tarefas"
        onToggle={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    expect(screen.getByText('Descrição da tarefa')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    expect(onDelete).toHaveBeenCalledWith(detailedOccurrence);
    expect(screen.queryByText('Descrição da tarefa')).not.toBeInTheDocument();
  });

  it('separa tarefas semanais em cards e oferece editar e excluir no menu', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <TaskList
        items={[occurrence]}
        emptyText="Sem tarefas"
        onToggle={vi.fn()}
        onDelete={onDelete}
        onEdit={onEdit}
        weekly
      />,
    );

    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar tarefa' }));
    expect(onEdit).toHaveBeenCalledWith(occurrence);

    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    expect(onDelete).toHaveBeenCalledWith(occurrence);
  });

  it('exibe a descrição diretamente abaixo do título semanal', () => {
    render(
      <TaskList
        items={[detailedOccurrence]}
        emptyText="Sem tarefas"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        weekly
      />,
    );

    expect(screen.getByText('Descrição da tarefa')).toBeInTheDocument();
    expect(screen.queryByLabelText('Mostrar detalhes')).not.toBeInTheDocument();
  });
});
