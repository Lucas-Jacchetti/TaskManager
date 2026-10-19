import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekPage } from './WeekPage';
import { authApi } from '../auth/api';
import { useWeek } from './useWeek';

vi.mock('../auth/api', () => ({
  authApi: {
    me: vi.fn(),
  },
}));

vi.mock('./useWeek', () => ({
  useWeek: vi.fn(),
}));

const occurrence = {
  id: 'occurrence-1',
  taskId: 'task-1',
  title: 'Beber água',
  description: null,
  type: 'daily' as const,
  recurrence: 'RECURRING' as const,
  daysOfWeek: null,
  referenceDate: '2026-10-19',
  createdAt: '2026-10-01T00:00:00.000Z',
  completed: false,
};

const weekState = {
  weekStart: '2026-10-19',
  todayDate: '2026-10-19',
  items: [occurrence],
  loading: false,
  error: null,
  isCurrentWeek: true,
  canGoNext: true,
  goPrev: vi.fn(),
  goNext: vi.fn(),
  goToday: vi.fn(),
  toggle: vi.fn(),
};

describe('WeekPage', () => {
  it('renderiza o cabeçalho, a tarefa diária e o usuário', async () => {
    vi.mocked(authApi.me).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@exemplo.com',
    });
    vi.mocked(useWeek).mockReturnValue(weekState);

    render(<WeekPage onLogout={vi.fn()} />);

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Minhas tarefas')).toBeInTheDocument();
    expect(screen.getByText('Beber água')).toBeInTheDocument();
    expect(screen.getByText('Sem tarefas semanais')).toBeInTheDocument();
  });

  it('renderiza o estado de carregamento', () => {
    vi.mocked(useWeek).mockReturnValue({ ...weekState, loading: true });

    render(<WeekPage onLogout={vi.fn()} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Tarefas da semana')).not.toBeInTheDocument();
  });

  it('renderiza erros da semana', () => {
    vi.mocked(useWeek).mockReturnValue({
      ...weekState,
      error: 'Não foi possível carregar',
    });

    render(<WeekPage onLogout={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });
});
