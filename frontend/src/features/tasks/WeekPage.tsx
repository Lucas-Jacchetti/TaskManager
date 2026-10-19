import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, ListTodo, LogOut, Plus } from 'lucide-react';
import { addDays } from '../../lib/dates';
import { authApi } from '../auth/api';
import { DayCard } from './components/DayCard';
import { TaskList } from './components/TaskList';
import { WeekNav } from './components/WeekNav';
import { useWeek } from './useWeek';

function monthYearLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

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
  const completedWeekCount = week.items.filter((item) => item.completed).length;
  const monthTitle = monthYearLabel(week.weekStart);

  return (
    <div className="min-h-screen bg-[#f3f5fd]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-305 items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-500">
              <ListTodo size={20} />
            </div>
            <div>
              <h1 className="text-[36px] font-semibold tracking-tight text-slate-800">
                Minhas tarefas
              </h1>
              <p className="text-sm text-slate-400">
                Uma semana organizada, um dia de cada vez.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userName && <span className="text-sm text-slate-400">{userName}</span>}
            <button
              onClick={onLogout}
              aria-label="Sair"
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-red-400 transition hover:text-slate-600"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-305 px-6 pb-6 pt-8">
        <section className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[34px] font-semibold tracking-tight text-slate-800">
              {monthTitle}
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              {week.items.length} tarefas na semana • {completedWeekCount} concluída
              {completedWeekCount === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
              <Plus size={16} />
              Nova tarefa
            </button>
            <WeekNav
              weekStart={week.weekStart}
              canGoNext={week.canGoNext}
              onPrev={week.goPrev}
              onNext={week.goNext}
            />
          </div>
        </section>

        {week.error && (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {week.error}
          </p>
        )}

        {week.loading ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
            Carregando...
          </p>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
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

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-800">
                  Tarefas da semana
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {weeklyItems.length}
                  </span>
                </h3>
                
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {weeklyItems.length === 0 ? (
                  <div className="flex min-h-60 flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                      <ClipboardList size={20} />
                    </div>
                    <p className="text-2xl font-semibold text-slate-700">
                      Sem tarefas semanais
                    </p>
                    <p className="mt-2 max-w-md text-sm text-slate-400">
                      Deixe aqui o que pode ser feito em qualquer dia.
                      <br />
                      Crie uma tarefa para começar a planejar.
                    </p>
                    <button className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-emerald-500 transition hover:text-emerald-600">
                      <Plus size={14} />
                      Adicionar tarefa semanal
                    </button>
                  </div>
                ) : (
                  <TaskList
                    items={weeklyItems}
                    emptyText="Sem tarefas semanais"
                    onToggle={week.toggle}
                    className="flex flex-col gap-3"
                  />
                )}
              </div>
            </section>

            <footer className="mt-3 flex items-center justify-between text-sm text-slate-300">
              <p></p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-400" />
                  Pendente
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Concluída
                </span>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
