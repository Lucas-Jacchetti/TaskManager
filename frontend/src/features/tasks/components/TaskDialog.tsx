import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { errorMessage } from '../../../lib/http';
import type { CreateTaskInput, Occurrence, TaskRecurrence, TaskType } from '../types';

interface Props {
  weeklyOnly?: boolean;
  onClose: () => void;
  onCreate: (input: CreateTaskInput) => Promise<void>;
  initialOccurrence?: Occurrence;
  onUpdate?: (taskId: string, input: CreateTaskInput) => Promise<void>;
}

const weekdays = [
  ['1', 'Seg'],
  ['2', 'Ter'],
  ['3', 'Qua'],
  ['4', 'Qui'],
  ['5', 'Sex'],
  ['6', 'Sáb'],
  ['0', 'Dom'],
] as const;

export function TaskDialog({
  weeklyOnly = false,
  onClose,
  onCreate,
  initialOccurrence,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState(initialOccurrence?.title ?? '');
  const [description, setDescription] = useState(initialOccurrence?.description ?? '');
  const [type, setType] = useState<TaskType>(
    initialOccurrence?.type ?? (weeklyOnly ? 'weekly' : 'custom'),
  );
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(
    initialOccurrence?.recurrence ?? 'ONCE',
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialOccurrence?.daysOfWeek ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (type === 'custom' && daysOfWeek.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const input = {
        title,
        description: description || null,
        type,
        recurrence,
        ...(type === 'custom' ? { daysOfWeek } : {}),
      };
      if (initialOccurrence && onUpdate) {
        await onUpdate(initialOccurrence.taskId, input);
      } else {
        await onCreate(input);
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {initialOccurrence
              ? 'Editar tarefa'
              : weeklyOnly
                ? 'Adicionar tarefa semanal'
                : 'Nova tarefa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Título
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              maxLength={120}
              required
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              maxLength={500}
            />
          </label>

          {!weeklyOnly && (
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Tipo
              <select
                value={type}
                onChange={(event) => setType(event.target.value as TaskType)}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="daily">Diária</option>
                <option value="custom">Personalizada</option>
                <option value="weekly">Semanal</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Recorrência
            <select
              value={recurrence}
              onChange={(event) =>
                setRecurrence(event.target.value as TaskRecurrence)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            >
              <option value="ONCE">Só desta vez</option>
              <option value="RECURRING">Todas as semanas</option>
            </select>
          </label>

          <fieldset
            disabled={type !== 'custom'}
            aria-disabled={type !== 'custom'}
            className={type !== 'custom' ? 'opacity-40' : undefined}
          >
            <legend className="mb-1 text-sm text-slate-600">
              Dias da semana
            </legend>
            <div className="flex flex-wrap gap-2">
              {weekdays.map(([value, label]) => {
                const day = Number(value);
                return (
                  <label
                    key={value}
                    className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 ${
                      type !== 'custom'
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Salvando...' : initialOccurrence ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
}
