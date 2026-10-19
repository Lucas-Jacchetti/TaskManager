import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tasksApi } from './api';
import { useWeek } from './useWeek';

vi.mock('./api', () => ({
  tasksApi: {
    week: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    uncomplete: vi.fn(),
  },
}));

vi.mock('../../lib/http', () => ({
  errorMessage: vi.fn(() => 'Erro ao carregar tarefas'),
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

describe('useWeek', () => {
  beforeEach(() => {
    vi.mocked(tasksApi.week).mockReset();
    vi.mocked(tasksApi.create).mockReset();
    vi.mocked(tasksApi.remove).mockReset();
    vi.mocked(tasksApi.update).mockReset();
    vi.mocked(tasksApi.complete).mockReset();
    vi.mocked(tasksApi.uncomplete).mockReset();
  });

  it('carrega as tarefas da semana atual', async () => {
    vi.mocked(tasksApi.week).mockResolvedValue([occurrence]);
    const { result } = renderHook(() => useWeek());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.items).toEqual([occurrence]));
    expect(result.current.loading).toBe(false);
    expect(tasksApi.week).toHaveBeenCalledOnce();
  });

  it('mostra erro e lista vazia quando o carregamento falha', async () => {
    vi.mocked(tasksApi.week).mockRejectedValue(new Error('falha'));
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.error).toBe('Erro ao carregar tarefas'));
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('atualiza otimisticamente e conclui a tarefa', async () => {
    vi.mocked(tasksApi.week).mockResolvedValue([occurrence]);
    vi.mocked(tasksApi.complete).mockResolvedValue(undefined);
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.toggle(occurrence);
    });

    expect(result.current.items[0].completed).toBe(true);
    expect(tasksApi.complete).toHaveBeenCalledWith('occurrence-1');
  });

  it('desfaz a atualização quando o servidor recusa a conclusão', async () => {
    vi.mocked(tasksApi.week).mockResolvedValue([occurrence]);
    vi.mocked(tasksApi.complete).mockRejectedValue(new Error('falha'));
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.toggle(occurrence);
    });

    expect(result.current.items[0].completed).toBe(false);
    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar tarefas'),
    );
  });

  it('navega para a semana anterior e posterior', async () => {
    vi.mocked(tasksApi.week).mockResolvedValue([]);
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialWeek = result.current.weekStart;

    act(() => result.current.goPrev());
    await waitFor(() => expect(result.current.weekStart).not.toBe(initialWeek));
    const previousWeek = result.current.weekStart;

    act(() => result.current.goNext());
    await waitFor(() => expect(result.current.weekStart).toBe(initialWeek));
    expect(previousWeek).not.toBe(initialWeek);
  });

  it('cria uma tarefa e recarrega a semana', async () => {
    vi.mocked(tasksApi.week)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([occurrence]);
    vi.mocked(tasksApi.create).mockResolvedValue(undefined);
    const { result } = renderHook(() => useWeek());
    const input = {
      title: 'Beber água',
      description: null,
      type: 'daily' as const,
      recurrence: 'RECURRING' as const,
    };

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.create(input);
    });

    expect(tasksApi.create).toHaveBeenCalledWith(
      result.current.weekStart,
      input,
    );
    expect(result.current.items).toEqual([occurrence]);
  });

  it('remove uma tarefa e recarrega a semana', async () => {
    vi.mocked(tasksApi.week)
      .mockResolvedValueOnce([occurrence])
      .mockResolvedValueOnce([]);
    vi.mocked(tasksApi.remove).mockResolvedValue(undefined);
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.items).toEqual([occurrence]));
    await act(async () => {
      await result.current.remove('task-1');
    });

    expect(tasksApi.remove).toHaveBeenCalledWith('task-1');
    expect(result.current.items).toEqual([]);
  });

  it('expõe erro quando criar ou remover falha', async () => {
    vi.mocked(tasksApi.week).mockResolvedValue([]);
    vi.mocked(tasksApi.create).mockRejectedValue(new Error('falha'));
    vi.mocked(tasksApi.remove).mockRejectedValue(new Error('falha'));
    const { result } = renderHook(() => useWeek());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await expect(
        result.current.create({
          title: 'Tarefa',
          description: null,
          type: 'daily',
          recurrence: 'ONCE',
        }),
      ).rejects.toThrow();
    });
    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar tarefas'),
    );

    await act(async () => {
      await expect(result.current.remove('task-1')).rejects.toThrow();
    });
    await waitFor(() =>
      expect(result.current.error).toBe('Erro ao carregar tarefas'),
    );
  });
});
