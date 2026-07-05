import { describe, expect, it } from 'vitest';
import { resolveDragEnd } from './dndHelpers';
import type { Column, Task } from '../../shared/types/api';

type ResolveDragEndArgs = Parameters<typeof resolveDragEnd>[0];

interface FakeDragItem {
  id: string;
  data: { current: { type: string; columnId?: string } };
}

function fakeEvent(active: FakeDragItem, over: FakeDragItem | null): ResolveDragEndArgs {
  return { active, over } as unknown as ResolveDragEndArgs;
}

function makeTask(id: string, columnId: string, order: number): Task {
  return {
    id,
    columnId,
    title: `Tarefa ${id}`,
    description: null,
    assigneeId: null,
    dueDate: null,
    order,
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
  };
}

const columns: Column[] = [
  { id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 },
  { id: 'col-2', boardId: 'board-1', name: 'Em Progresso', order: 1 },
];

describe('resolveDragEnd', () => {
  it('returns null when there is no drop target', () => {
    const event = fakeEvent({ id: 'task-1', data: { current: { type: 'task', columnId: 'col-1' } } }, null);

    expect(resolveDragEnd(event, columns, {})).toBeNull();
  });

  it('resolves a column reorder', () => {
    const event = fakeEvent(
      { id: 'col-1', data: { current: { type: 'column' } } },
      { id: 'col-2', data: { current: { type: 'column' } } },
    );

    expect(resolveDragEnd(event, columns, {})).toEqual({
      type: 'reorderColumn',
      columnId: 'col-1',
      order: 1,
    });
  });

  it('resolves dropping a task onto another task in a different column', () => {
    const tasksByColumn = {
      'col-1': [makeTask('t1', 'col-1', 0)],
      'col-2': [makeTask('t2', 'col-2', 0), makeTask('t3', 'col-2', 1)],
    };
    const event = fakeEvent(
      { id: 't1', data: { current: { type: 'task', columnId: 'col-1' } } },
      { id: 't3', data: { current: { type: 'task', columnId: 'col-2' } } },
    );

    expect(resolveDragEnd(event, columns, tasksByColumn)).toEqual({
      type: 'moveTask',
      taskId: 't1',
      fromColumnId: 'col-1',
      toColumnId: 'col-2',
      order: 1,
    });
  });

  it('resolves dropping a task onto an empty column dropzone by appending to the end', () => {
    const tasksByColumn = {
      'col-1': [makeTask('t1', 'col-1', 0)],
      'col-2': [],
    };
    const event = fakeEvent(
      { id: 't1', data: { current: { type: 'task', columnId: 'col-1' } } },
      { id: 'dropzone-col-2', data: { current: { type: 'column-dropzone', columnId: 'col-2' } } },
    );

    expect(resolveDragEnd(event, columns, tasksByColumn)).toEqual({
      type: 'moveTask',
      taskId: 't1',
      fromColumnId: 'col-1',
      toColumnId: 'col-2',
      order: 0,
    });
  });

  it('resolves dropping a task directly onto a column (not its dropzone or a task) by appending to the end', () => {
    // The column header/wrapper is itself a droppable region nested around the
    // dropzone — dnd-kit can resolve `over` to it instead of the dropzone.
    const tasksByColumn = {
      'col-1': [makeTask('t1', 'col-1', 0)],
      'col-2': [makeTask('t2', 'col-2', 0)],
    };
    const event = fakeEvent(
      { id: 't1', data: { current: { type: 'task', columnId: 'col-1' } } },
      { id: 'col-2', data: { current: { type: 'column' } } },
    );

    expect(resolveDragEnd(event, columns, tasksByColumn)).toEqual({
      type: 'moveTask',
      taskId: 't1',
      fromColumnId: 'col-1',
      toColumnId: 'col-2',
      order: 1,
    });
  });

  it('resolves a column reorder when dropped over a task inside the target column', () => {
    const tasksByColumn = {
      'col-1': [],
      'col-2': [makeTask('t2', 'col-2', 0)],
    };
    const event = fakeEvent(
      { id: 'col-1', data: { current: { type: 'column' } } },
      { id: 't2', data: { current: { type: 'task', columnId: 'col-2' } } },
    );

    expect(resolveDragEnd(event, columns, tasksByColumn)).toEqual({
      type: 'reorderColumn',
      columnId: 'col-1',
      order: 1,
    });
  });
});
