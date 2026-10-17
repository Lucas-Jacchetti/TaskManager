import { addDays, getDayOfWeek, getWeekStart } from '../../common/utils/date.util';
import { TaskType } from '../../features/tasks/task-type.enum';


export function getWeekOccurrenceDates(type: TaskType, daysOfWeek: number[] | null, weekStart: string,): string[] {
    if (type === TaskType.WEEKLY) {
        return [weekStart];
    }

    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
        (date) =>
        type === TaskType.DAILY ||
        (daysOfWeek?.includes(getDayOfWeek(date)) ?? false),
    );
}

export function getInitialOccurrenceDates(type: TaskType, daysOfWeek: number[] | null, today: string,): string[] {
    const weekStart = getWeekStart(today);
    const thisWeek = getWeekOccurrenceDates(type, daysOfWeek, weekStart).filter(
        (date) => type === TaskType.WEEKLY || date >= today,
    );

    if (thisWeek.length > 0 || type !== TaskType.CUSTOM) {
        return thisWeek;
    }

    return getWeekOccurrenceDates(type, daysOfWeek, addDays(weekStart, 7));
}