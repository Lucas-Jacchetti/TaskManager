import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '../../../lib/dates';

interface Props {
  weekStart: string;
  isCurrentWeek: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const arrowClass =
  'rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent';

export function WeekNav({
  weekStart,
  isCurrentWeek,
  canGoNext,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <nav className="my-4 flex items-center justify-center gap-4">
      <button onClick={onPrev} aria-label="Semana anterior" className={arrowClass}>
        <ChevronLeft size={22} />
      </button>

      <div className="flex min-w-36 flex-col items-center">
        <strong>{formatWeekRange(weekStart)}</strong>
        <button
          onClick={onToday}
          disabled={isCurrentWeek}
          className="text-sm text-black hover:underline disabled:opacity-30 disabled:hover:no-underline"
        >
          Hoje
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Próxima semana"
        className={arrowClass}
      >
        <ChevronRight size={22} />
      </button>
    </nav>
  );
}
