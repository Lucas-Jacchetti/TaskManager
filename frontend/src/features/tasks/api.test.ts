import { beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../lib/http';
import { tasksApi } from './api';

vi.mock('../../lib/http', () => ({ request: vi.fn() }));

describe('tasksApi', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(request).mockResolvedValue(undefined);
  });

  it('consulta as ocorrências da semana', async () => {
    await tasksApi.week('2026-10-12');
    expect(request).toHaveBeenCalledWith('/tasks/week?date=2026-10-12');
  });

  it('cria uma tarefa na data informada', async () => {
    const input = {
      title: 'Beber água',
      description: null,
      type: 'daily' as const,
      recurrence: 'RECURRING' as const,
    };

    await tasksApi.create('2026-10-12', input);

    expect(request).toHaveBeenCalledWith('/tasks?date=2026-10-12', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  });

  it('exclui uma tarefa', async () => {
    await tasksApi.remove('task-1');

    expect(request).toHaveBeenCalledWith('/tasks/task-1', {
      method: 'DELETE',
    });
  });

  it('atualiza uma tarefa', async () => {
      const input = {
        title: 'Beber água',
        type: 'daily' as const,
        recurrence: 'RECURRING' as const,
      };

      await tasksApi.update('task-1', input);

      expect(request).toHaveBeenCalledWith('/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
  });

  it('conclui uma ocorrência', async () => {
    await tasksApi.complete('occurrence-1');
    expect(request).toHaveBeenCalledWith('/tasks/occurrences/occurrence-1/complete', {
      method: 'POST',
    });
  });

  it('desfaz a conclusão de uma ocorrência', async () => {
    await tasksApi.uncomplete('occurrence-1');
    expect(request).toHaveBeenCalledWith('/tasks/occurrences/occurrence-1/completion', {
      method: 'DELETE',
    });
  });
});
