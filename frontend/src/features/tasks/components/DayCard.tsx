import { dayMonth, getDayOfWeek } from '../../../lib/dates';
import { WEEKDAY_NAMES } from '../labels';
import type { Occurrence } from '../types';
import { TaskList } from './TaskList';

interface Props {
  date: string;
  isToday: boolean;
  items: Occurrence[];
  onToggle: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  onEdit: (occurrence: Occurrence) => void;
}

export function DayCard({ date, isToday, items, onToggle, onDelete, onEdit }: Props) {
  const completed = items.filter((item) => item.completed).length;

  return (
    <article
      className={`flex min-h-64 flex-col rounded-2xl border bg-white p-3 shadow-sm ${
        isToday
          ? 'border-sky-300 ring-1 ring-sky-300'
          : 'border-slate-200'
      }`}
    >
      <header className="mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">
            {WEEKDAY_NAMES[getDayOfWeek(date)]}
          </span>
          {isToday && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-600">
              Hoje
            </span>
          )}
        </div>
        <strong className="mt-1 block text-4xl font-semibold tracking-tight text-slate-800">
          {dayMonth(date)}
        </strong>
      </header>

      <div className="flex-1">
        <TaskList
          items={items}
          emptyText="Sem tarefas"
          emptyClassName="text-sm text-slate-300"
          onToggle={onToggle}
          onDelete={onDelete}
          detailsMode="modal"
          onEdit={onEdit}
        />
      </div>

      <footer className="mt-3 text-xs text-slate-400">
        {items.length === 0 ? (
          'Seu dia está livre'
        ) : (
          <span className="inline-flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                completed === items.length ? 'bg-emerald-400' : 'bg-yellow-400'
              }`}
            />
            {completed} de {items.length} concluída{items.length > 1 ? 's' : ''}
          </span>
        )}
      </footer>
    </article>
  );
}
