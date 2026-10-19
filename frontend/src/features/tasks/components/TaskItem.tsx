import { Circle, CircleCheck, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { Occurrence } from '../types';

interface Props {
  occurrence: Occurrence;
  onToggle: (occurrence: Occurrence) => void;
  onDetails: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  onEdit?: (occurrence: Occurrence) => void;
  weekly?: boolean;
}

export function TaskItem({
  occurrence,
  onToggle,
  onDetails,
  onDelete,
  onEdit,
  weekly = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { title, completed } = occurrence;

  return (
    <div className="rounded-md">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggle(occurrence)}
          aria-label={completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
          className={`cursor-pointer rounded-md p-0.5 transition hover:bg-slate-100 ${
            completed ? 'text-emerald-300' : 'text-slate-300'
          }`}
        >
          {completed ? <CircleCheck size={16} /> : <Circle size={16} />}
        </button>

        <div className="min-w-0 flex-1">
          <span
            className={`block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium ${
              completed ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {title}
          </span>
          {weekly && occurrence.description && (
            <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400">
              {occurrence.description}
            </p>
          )}
        </div>

        {weekly ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Opções da tarefa"
              className="grid cursor-pointer place-items-center rounded-md p-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-500"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {onEdit && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(occurrence);
                    }}
                    className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Editar tarefa
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(occurrence);
                  }}
                  className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Excluir tarefa
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Opções da tarefa"
              className="grid cursor-pointer list-none place-items-center rounded-md p-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-500 [&::-webkit-details-marker]:hidden"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button
                onClick={() => {
                  setMenuOpen(false);
                  onDetails(occurrence);
                }}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                Ver detalhes
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(occurrence);
                }}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Excluir tarefa
              </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
