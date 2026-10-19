import { useEffect, useState } from 'react';
import { addDays, getWeekStart, today } from '../../lib/dates';
import { errorMessage } from '../../lib/http';
import { tasksApi } from './api';
import type { CreateTaskInput, Occurrence } from './types';

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
    loadWeek(weekStart, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  async function loadWeek(date: string, isCancelled = () => false) {
    try {
      const loaded = await tasksApi.week(date);
      if (isCancelled()) return;
      setError(null);
      setData({ weekStart: date, items: loaded });
    } catch (err) {
      if (isCancelled()) return;
      setError(errorMessage(err));
      setData({ weekStart: date, items: [] });
    }
  }

  async function create(input: CreateTaskInput) {
    try {
      await tasksApi.create(weekStart, input);
      await loadWeek(weekStart);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }
  }

  async function remove(taskId: string) {
    try {
      await tasksApi.remove(taskId);
      await loadWeek(weekStart);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }

  }

  async function update(taskId: string, input: CreateTaskInput) {
    try {
      await tasksApi.update(taskId, input);
      await loadWeek(weekStart);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }
  }

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
    create,
    remove,
    update,
    toggle,
  };
}
