import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '../../../lib/dates';

interface Props {
  weekStart: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const arrowClass =
  'grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

export function WeekNav({ weekStart, canGoNext, onPrev, onNext }: Props) {
  return (
    <nav className="flex items-center gap-2">
      <button onClick={onPrev} aria-label="Semana anterior" className={arrowClass}>
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
        <CalendarDays size={15} className="text-slate-400" />
        {formatWeekRange(weekStart)}
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Próxima semana"
        className={arrowClass}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
