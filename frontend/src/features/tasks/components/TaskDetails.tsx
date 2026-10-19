import { X } from 'lucide-react';
import type { Occurrence } from '../types';
import { RECURRENCE_LABEL, TYPE_LABEL, describeDays } from '../labels';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="wrap-break-word text-slate-700">{value}</dd>
    </div>
  );
}

interface Props {
  occurrence: Occurrence;
  onClose: () => void;
  onEdit?: () => void;
  modal?: boolean;
  weekly?: boolean;
}

export function TaskDetails({
  occurrence,
  onClose,
  onEdit,
  modal = false,
  weekly = false,
}: Props) {
  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-sm font-semibold text-slate-700">Detalhes da tarefa</strong>
        <div className="flex items-center gap-2">
          {weekly && onEdit && (
            <button
              onClick={onEdit}
              className="cursor-pointer rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
            >
              Editar tarefa
            </button>
          )}
          {!weekly && (
            <button
              onClick={onClose}
              aria-label="Fechar detalhes"
              className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <Detail label="Descrição" value={occurrence.description ?? 'Sem descrição'} />
        <Detail label="Tipo" value={TYPE_LABEL[occurrence.type]} />
        <Detail label="Recorrência" value={RECURRENCE_LABEL[occurrence.recurrence]} />
        <Detail label="Dias" value={describeDays(occurrence)} />
      </dl>
      {onEdit && !weekly && (
        <button
          onClick={onEdit}
          className="mt-4 cursor-pointer rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600"
        >
          Editar tarefa
        </button>
      )}
    </>
  );

  if (modal) {
    return (
      <div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/30 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50 p-3 ${weekly ? 'mt-4' : 'mb-3'}`}>
      {content}
    </div>
  );
}
