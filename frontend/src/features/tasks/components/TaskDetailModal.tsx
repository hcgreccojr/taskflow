import { useMemo, useState } from 'react';
import { useBoardsStore } from '../../boards/store/boardsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useToastStore } from '../../../shared/store/toastStore';
import { Modal } from '../../../shared/components/Modal';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import { PriorityPill } from '../../../shared/components/PriorityPill';
import { CommentsPanel } from './CommentsPanel';
import { ActivityPanel } from './ActivityPanel';
import type { Column, Member, TaskPriority } from '../../../shared/types/api';
import styles from './TaskDetailModal.module.css';

interface TaskDetailModalProps {
  taskId: string;
  columns: Column[];
  members: Member[];
  onClose: () => void;
}

type Tab = 'comments' | 'activity';

export function TaskDetailModal({ taskId, columns, members, onClose }: TaskDetailModalProps) {
  const tasksByColumn = useBoardsStore((state) => state.tasksByColumn);
  const updateTask = useBoardsStore((state) => state.updateTask);
  const moveTask = useBoardsStore((state) => state.moveTask);
  const deleteTask = useBoardsStore((state) => state.deleteTask);
  const currentUser = useAuthStore((state) => state.user);
  const pushToast = useToastStore((state) => state.push);

  const task = useMemo(() => {
    for (const columnId of Object.keys(tasksByColumn)) {
      const found = tasksByColumn[columnId].find((t) => t.id === taskId);
      if (found) return found;
    }
    return undefined;
  }, [tasksByColumn, taskId]);

  const membersById = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members]);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [columnId, setColumnId] = useState(task?.columnId ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  const [tab, setTab] = useState<Tab>('comments');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  async function onSave() {
    setSaving(true);
    try {
      await updateTask(taskId, task!.columnId, {
        title,
        description,
        assigneeId: assigneeId || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      if (columnId !== task!.columnId) {
        const destinationCount = (tasksByColumn[columnId] ?? []).length;
        await moveTask(taskId, task!.columnId, columnId, destinationCount);
      }
      pushToast('Tarefa atualizada');
      onClose();
    } catch {
      pushToast('Não foi possível salvar as alterações', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    await deleteTask(taskId, task!.columnId);
    pushToast('Tarefa excluída');
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PriorityPill priority={priority} />
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className={styles.descriptionInput}
            placeholder="Adicione uma descrição..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'comments' ? styles.tabActive : ''}`}
              onClick={() => setTab('comments')}
            >
              Comentários
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'activity' ? styles.tabActive : ''}`}
              onClick={() => setTab('activity')}
            >
              Histórico
            </button>
          </div>

          {tab === 'comments' ? (
            <CommentsPanel taskId={taskId} currentUserId={currentUser?.id ?? ''} membersById={membersById} />
          ) : (
            <ActivityPanel taskId={taskId} membersById={membersById} />
          )}
        </div>

        <div className={styles.sidebar}>
          <Select
            label="Responsável"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Sem responsável</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </Select>

          <Select label="Coluna" value={columnId} onChange={(event) => setColumnId(event.target.value)}>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </Select>

          <Select
            label="Prioridade"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
          </Select>

          <label>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-secondary)',
                marginBottom: 6,
              }}
            >
              Prazo
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              style={{
                width: '100%',
                padding: '11px 13px',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-input)',
              }}
            />
          </label>

          <div className={styles.sidebarActions}>
            <Button onClick={onSave} disabled={saving} fullWidth>
              Salvar alterações
            </Button>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)} fullWidth>
              Excluir tarefa
            </Button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Excluir tarefa"
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  );
}
