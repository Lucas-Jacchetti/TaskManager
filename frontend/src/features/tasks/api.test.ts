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
