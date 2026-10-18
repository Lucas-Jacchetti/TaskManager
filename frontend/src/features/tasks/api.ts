import { request } from '../../lib/http';
import type { Occurrence } from './types';

export const tasksApi = {
  week: (date: string) => request<Occurrence[]>(`/tasks/week?date=${date}`),

  complete: (occurrenceId: string) =>
    request<void>(`/tasks/occurrences/${occurrenceId}/complete`, {
      method: 'POST',
    }),

  uncomplete: (occurrenceId: string) =>
    request<void>(`/tasks/occurrences/${occurrenceId}/completion`, {
      method: 'DELETE',
    }),
};
