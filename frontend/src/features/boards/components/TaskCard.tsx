import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Member, Task } from '../../../shared/types/api';
import { Avatar } from '../../../shared/components/Avatar';
import { PriorityPill } from '../../../shared/components/PriorityPill';
import { DueDateChip } from '../../../shared/components/DueDateChip';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  assignee?: Member;
  onOpen: (taskId: string) => void;
}

export function TaskCard({ task, assignee, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
    >
      <div className={styles.topRow}>
        <PriorityPill priority={task.priority} />
      </div>
      <div className={styles.title}>{task.title}</div>
      <div className={styles.footer}>
        <Avatar name={assignee?.name} size={22} />
        <DueDateChip dueDate={task.dueDate} />
        <span className={styles.spacer} />
      </div>
    </div>
  );
}
