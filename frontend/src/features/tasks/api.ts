import { request } from '../../lib/http';
import type { CreateTaskInput, Occurrence } from './types';

export const tasksApi = {
  week: (date: string) => request<Occurrence[]>(`/tasks/week?date=${date}`),

  create: (date: string, input: CreateTaskInput) =>
    request<void>(`/tasks?date=${date}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (taskId: string, input: Partial<CreateTaskInput>) =>
    request<void>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  complete: (occurrenceId: string) =>
    request<void>(`/tasks/occurrences/${occurrenceId}/complete`, {
      method: 'POST',
    }),

  uncomplete: (occurrenceId: string) =>
    request<void>(`/tasks/occurrences/${occurrenceId}/completion`, {
      method: 'DELETE',
    }),
};
