import type { Occurrence } from '../types';
import { TaskItem } from './TaskItem';

interface Props {
  items: Occurrence[];
  emptyText: string;
  onToggle: (occurrence: Occurrence) => void;
}

export function TaskList({ items, emptyText, onToggle }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <TaskItem key={item.id} occurrence={item} onToggle={onToggle} />
      ))}
    </ul>
  );
}
