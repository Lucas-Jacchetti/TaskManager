import { useState } from 'react';
import type { Occurrence } from '../types';
import { TaskDetails } from './TaskDetails';
import { TaskItem } from './TaskItem';

interface Props {
  items: Occurrence[];
  emptyText: string;
  onToggle: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  className?: string;
  emptyClassName?: string;
  detailsMode?: 'inline' | 'modal';
  onEdit?: (occurrence: Occurrence) => void;
  weekly?: boolean;
}

export function TaskList({
  items,
  emptyText,
  onToggle,
  onDelete,
  className,
  emptyClassName,
  detailsMode = 'inline',
  onEdit,
  weekly = false,
}: Props) {
  const [selected, setSelected] = useState<Occurrence | null>(null);

  if (items.length === 0) {
    return <p className={emptyClassName ?? 'text-sm text-slate-400'}>{emptyText}</p>;
  }

  return (
    <>
      {selected && detailsMode === 'modal' && (
        <TaskDetails
          occurrence={selected}
          modal={detailsMode === 'modal'}
          onClose={() => setSelected(null)}
          onEdit={
            onEdit
              ? () => {
                  onEdit(selected);
                  setSelected(null);
                }
              : undefined
          }
        />
      )}
      <ul className={className ?? 'flex flex-col gap-1'}>
        {items.map((item) => (
          <li
            key={item.id}
            className={weekly ? 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' : undefined}
          >
            <TaskItem
              occurrence={item}
              onToggle={onToggle}
              onDetails={(occurrence) =>
                setSelected((current) =>
                  current?.id === occurrence.id ? null : occurrence,
                )
              }
              onEdit={onEdit}
              onDelete={(occurrence) => {
                setSelected(null);
                onDelete(occurrence);
              }}
              weekly={weekly}
            />
            {detailsMode === 'inline' && !weekly && selected?.id === item.id && (
              <TaskDetails
                occurrence={selected}
                onClose={() => setSelected(null)}
                onEdit={
                  onEdit
                    ? () => {
                        onEdit(selected);
                        setSelected(null);
                      }
                    : undefined
                }
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
