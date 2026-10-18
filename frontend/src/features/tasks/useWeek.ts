import { useEffect, useState } from 'react';
import { addDays, getWeekStart, today } from '../../lib/dates';
import { errorMessage } from '../../lib/http';
import { tasksApi } from './api';
import type { Occurrence } from './types';

const MAX_DAYS_AHEAD = 56;

interface WeekData {
  weekStart: string;
  items: Occurrence[];
}

export function useWeek() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today()));
  const [data, setData] = useState<WeekData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayDate = today();
  const loading = data?.weekStart !== weekStart;
  const items = data && !loading ? data.items : [];
  const isCurrentWeek = weekStart === getWeekStart(todayDate);
  const canGoNext = addDays(weekStart, 7) <= addDays(todayDate, MAX_DAYS_AHEAD);

  useEffect(() => {
    let cancelled = false;
    tasksApi
      .week(weekStart)
      .then((loaded) => {
        if (cancelled) return;
        setError(null);
        setData({ weekStart, items: loaded });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setData({ weekStart, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  function setCompleted(id: string, completed: boolean) {
    setData(
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) =>
            item.id === id ? { ...item, completed } : item,
          ),
        },
    );
  }

  async function toggle(occurrence: Occurrence) {
    const next = !occurrence.completed;
    setCompleted(occurrence.id, next);
    try {
      await (next
        ? tasksApi.complete(occurrence.id)
        : tasksApi.uncomplete(occurrence.id));
    } catch (err) {
      setCompleted(occurrence.id, !next);
      setError(errorMessage(err));
    }
  }

  return {
    weekStart,
    todayDate,
    items,
    loading,
    error,
    isCurrentWeek,
    canGoNext,
    goPrev: () => setWeekStart(addDays(weekStart, -7)),
    goNext: () => setWeekStart(addDays(weekStart, 7)),
    goToday: () => setWeekStart(getWeekStart(todayDate)),
    toggle,
  };
}
