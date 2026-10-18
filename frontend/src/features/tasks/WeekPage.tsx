import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { addDays } from '../../lib/dates';
import { authApi } from '../auth/api';
import { DayCard } from './components/DayCard';
import { TaskList } from './components/TaskList';
import { WeekNav } from './components/WeekNav';
import { useWeek } from './useWeek';

export function WeekPage({ onLogout }: { onLogout: () => void }) {
  const week = useWeek();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((user) => setUserName(user.name))
      .catch(() => undefined);
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(week.weekStart, i));
  const weeklyItems = week.items.filter((item) => item.type === 'weekly');

  return (
    <div className="mx-auto max-w-7xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Minhas tarefas</h1>
        <div className="flex items-center gap-2 text-slate-500">
          {userName && <span className="text-sm">{userName}</span>}
          <button
            onClick={onLogout}
            aria-label="Sair"
            className="rounded-lg p-1.5 transition hover:bg-slate-200"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <WeekNav
        weekStart={week.weekStart}
        isCurrentWeek={week.isCurrentWeek}
        canGoNext={week.canGoNext}
        onPrev={week.goPrev}
        onNext={week.goNext}
        onToday={week.goToday}
      />

      {week.error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {week.error}
        </p>
      )}

      {week.loading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <DayCard
                key={day}
                date={day}
                isToday={day === week.todayDate}
                items={week.items.filter(
                  (item) => item.type !== 'weekly' && item.referenceDate === day,
                )}
                onToggle={week.toggle}
              />
            ))}
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <h2 className="mb-2 font-semibold">Tarefas da semana</h2>
            <TaskList
              items={weeklyItems}
              emptyText="Sem tarefas semanais"
              onToggle={week.toggle}
            />
          </section>
        </>
      )}
    </div>
  );
}
