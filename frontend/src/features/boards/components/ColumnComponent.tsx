import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { Column, Member, Task } from '../../../shared/types/api';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { TaskCard } from './TaskCard';
import { InlineTaskComposer } from './InlineTaskComposer';
import styles from './ColumnComponent.module.css';

interface ColumnComponentProps {
  column: Column;
  tasks: Task[];
  membersById: Map<string, Member>;
  onOpenTask: (taskId: string) => void;
  onCreateTask: (columnId: string, title: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
}

export function ColumnComponent({
  column,
  tasks,
  membersById,
  onOpenTask,
  onCreateTask,
  onDeleteColumn,
}: ColumnComponentProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sortable = useSortable({ id: column.id, data: { type: 'column' } });
  const droppable = useDroppable({
    id: `dropzone-${column.id}`,
    data: { type: 'column-dropzone', columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <div ref={sortable.setNodeRef} style={style} className={styles.column}>
      <div className={styles.header}>
        <div className={styles.dragHandle} {...sortable.attributes} {...sortable.listeners}>
          <span className={styles.dot} />
          <span className={styles.name}>{column.name}</span>
          <span className={styles.count}>{tasks.length}</span>
        </div>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`Excluir coluna ${column.name}`}
          onClick={() => setConfirmingDelete(true)}
        >
          <X size={14} />
        </button>
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Excluir coluna"
          description="As tarefas desta coluna serão movidas para a primeira coluna do quadro. Esta ação não pode ser desfeita."
          onConfirm={async () => {
            await onDeleteColumn(column.id);
            setConfirmingDelete(false);
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      <div
        ref={droppable.setNodeRef}
        className={`${styles.body} ${droppable.isOver ? styles.bodyOver : ''}`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>
        <InlineTaskComposer onCreate={(title) => onCreateTask(column.id, title)} />
      </div>
    </div>
  );
}
