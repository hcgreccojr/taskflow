import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskDetailModal } from './TaskDetailModal';
import type { Column, Member, Task } from '../../../shared/types/api';

const updateTask = vi.fn().mockResolvedValue(undefined);
const moveTask = vi.fn().mockResolvedValue(undefined);
const deleteTask = vi.fn().mockResolvedValue(undefined);

const task: Task = {
  id: 'task-1',
  columnId: 'col-1',
  title: 'Escrever testes',
  description: null,
  assigneeId: null,
  dueDate: null,
  order: 0,
  priority: 'MEDIUM',
  createdAt: new Date().toISOString(),
};

interface FakeBoardsState {
  tasksByColumn: Record<string, Task[]>;
  updateTask: typeof updateTask;
  moveTask: typeof moveTask;
  deleteTask: typeof deleteTask;
}

interface FakeAuthState {
  user: { id: string; name: string; email: string; createdAt: string };
}

vi.mock('../../boards/store/boardsStore', () => ({
  useBoardsStore: (selector: (state: FakeBoardsState) => unknown) =>
    selector({ tasksByColumn: { 'col-1': [task] }, updateTask, moveTask, deleteTask }),
}));

vi.mock('../../auth/store/authStore', () => ({
  useAuthStore: (selector: (state: FakeAuthState) => unknown) =>
    selector({ user: { id: 'user-1', name: 'Ana', email: 'a@e.com', createdAt: new Date().toISOString() } }),
}));

vi.mock('./CommentsPanel', () => ({ CommentsPanel: () => <div>comments-panel</div> }));
vi.mock('./ActivityPanel', () => ({ ActivityPanel: () => <div>activity-panel</div> }));

const columns: Column[] = [{ id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 }];
const members: Member[] = [];

describe('TaskDetailModal', () => {
  it('saves the current field values against the task original column', async () => {
    const onClose = vi.fn();
    render(<TaskDetailModal taskId="task-1" columns={columns} members={members} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith('task-1', 'col-1', {
        title: 'Escrever testes',
        description: '',
        assigneeId: undefined,
        priority: 'MEDIUM',
        dueDate: undefined,
      }),
    );
    expect(moveTask).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('requires confirmation before deleting the task', async () => {
    const onClose = vi.fn();
    render(<TaskDetailModal taskId="task-1" columns={columns} members={members} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    expect(deleteTask).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith('task-1', 'col-1'));
  });
});
