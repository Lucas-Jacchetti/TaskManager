import { useState, type ReactNode } from 'react';
import { Circle, CircleCheck, MoreHorizontal } from 'lucide-react';
import { RECURRENCE_LABEL, TYPE_LABEL, describeDays } from '../labels';
import type { Occurrence } from '../types';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="break-words text-slate-700">{children}</dd>
    </div>
  );
}

interface Props {
  occurrence: Occurrence;
  onToggle: (occurrence: Occurrence) => void;
}

export function TaskItem({ occurrence, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const { title, completed, description, type, recurrence } = occurrence;

  return (
    <li className="rounded-md">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggle(occurrence)}
          aria-label={completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
          className={`cursor-pointer rounded-md p-0.5 transition hover:bg-slate-100 ${
            completed ? 'text-emerald-500' : 'text-slate-300'
          }`}
        >
          {completed ? <CircleCheck size={16} /> : <Circle size={16} />}
        </button>

        <span
          className={`min-w-0 flex-1 break-words text-sm font-medium ${
            completed ? 'text-slate-400 line-through' : 'text-slate-600'
          }`}
        >
          {title}
        </span>

        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Detalhes"
          className="cursor-pointer rounded-md p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {open && (
        <dl className="ml-6 mt-1.5 space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
          <Detail label="Descrição">{description ?? 'Sem descrição'}</Detail>
          <Detail label="Tipo">{TYPE_LABEL[type]}</Detail>
          <Detail label="Recorrência">{RECURRENCE_LABEL[recurrence]}</Detail>
          <Detail label="Dias">{describeDays(occurrence)}</Detail>
        </dl>
      )}
    </li>
  );
}
