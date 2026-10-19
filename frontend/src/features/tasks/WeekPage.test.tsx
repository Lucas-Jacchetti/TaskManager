import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  create: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
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

  it('abre o modal de nova tarefa e encaminha a criação', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useWeek).mockReturnValue({ ...weekState, create });

    render(<WeekPage onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nova tarefa' }));
    expect(screen.getByRole('heading', { name: 'Nova tarefa' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Ler' },
    });
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: 'daily' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        title: 'Ler',
        description: null,
        type: 'daily',
        recurrence: 'ONCE',
      }),
    );
  });

  it('abre o modal de tarefa semanal', () => {
    vi.mocked(useWeek).mockReturnValue({ ...weekState, items: [] });

    render(<WeekPage onLogout={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar tarefa semanal' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Adicionar tarefa semanal' }),
    ).toBeInTheDocument();
  });

  it('exclui a tarefa pelo taskId', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useWeek).mockReturnValue({ ...weekState, remove });

    render(<WeekPage onLogout={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('task-1'));
  });

  it('abre os detalhes da tarefa do dia como modal', () => {
    vi.mocked(useWeek).mockReturnValue(weekState);

    render(<WeekPage onLogout={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Opções da tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));

    expect(screen.getByText('Detalhes da tarefa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar tarefa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar detalhes' })).toBeInTheDocument();
  });
});
