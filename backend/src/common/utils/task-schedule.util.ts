import { addDays, getDayOfWeek } from '../../common/utils/date.util';
import { TaskType } from '../../features/tasks/task-type.enum';

export function getWeekOccurrenceDates(
  type: TaskType,
  daysOfWeek: number[] | null,
  weekStart: string,
): string[] {
  if (type === TaskType.WEEKLY) {
    return [weekStart];
  }

  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) =>
      type === TaskType.DAILY ||
      (daysOfWeek?.includes(getDayOfWeek(date)) ?? false),
  );
}