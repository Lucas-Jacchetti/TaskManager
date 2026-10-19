import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskDetails } from './TaskDetails';
import type { Occurrence } from '../types';

const occurrence: Occurrence = {
  id: 'occurrence-1',
  taskId: 'task-1',
  title: 'Estudar',
  description: 'Revisar os apontamentos',
  type: 'custom',
  recurrence: 'RECURRING',
  daysOfWeek: [1, 3, 5],
  referenceDate: '2026-10-19',
  createdAt: '2026-10-01T00:00:00.000Z',
  completed: false,
};

describe('TaskDetails', () => {
  it('renderiza descrição, tipo, recorrência e dias', () => {
    render(<TaskDetails occurrence={occurrence} onClose={vi.fn()} />);

    expect(screen.getByText('Revisar os apontamentos')).toBeInTheDocument();
    expect(screen.getByText('Personalizada')).toBeInTheDocument();
    expect(screen.getByText('Todas as semanas')).toBeInTheDocument();
    expect(screen.getByText('Seg, Qua, Sex')).toBeInTheDocument();
  });

  it('usa o texto padrão quando não há descrição', () => {
    render(
      <TaskDetails
        occurrence={{ ...occurrence, description: null }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Sem descrição')).toBeInTheDocument();
  });
});
