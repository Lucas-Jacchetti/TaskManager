import { dayMonth, getDayOfWeek } from '../../../lib/dates';
import { WEEKDAY_NAMES } from '../labels';
import type { Occurrence } from '../types';
import { TaskList } from './TaskList';

interface Props {
  date: string;
  isToday: boolean;
  items: Occurrence[];
  onToggle: (occurrence: Occurrence) => void;
}

export function DayCard({ date, isToday, items, onToggle }: Props) {
  return (
    <article
      className={`min-h-36 rounded-xl border bg-white p-3 ${
        isToday ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'
      }`}
    >
      <h2 className="mb-2 flex items-baseline gap-1.5 font-semibold">
        {WEEKDAY_NAMES[getDayOfWeek(date)]}
        <small className="font-normal text-slate-400">{dayMonth(date)}</small>
      </h2>
      <TaskList items={items} emptyText="Sem tarefas" onToggle={onToggle} />
    </article>
  );
}
