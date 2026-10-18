export type TaskType = 'daily' | 'weekly' | 'custom';
export type TaskRecurrence = 'ONCE' | 'RECURRING';

export interface Occurrence {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  type: TaskType;
  recurrence: TaskRecurrence;
  daysOfWeek: number[] | null;
  referenceDate: string;
  createdAt: string;
  completed: boolean;
}
