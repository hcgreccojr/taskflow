import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardsStore } from './boardsStore';
import * as boardsApi from '../../../services/boardsApi';
import * as columnsApi from '../../../services/columnsApi';
import * as tasksApi from '../../../services/tasksApi';
import type { Task } from '../../../shared/types/api';

vi.mock('../../../services/boardsApi');
vi.mock('../../../services/columnsApi');
vi.mock('../../../services/tasksApi');

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

describe('boardsStore', () => {
  beforeEach(() => {
    useBoardsStore.setState({ boardsByOrg: {}, columnsByBoard: {}, tasksByColumn: {}, loading: false });
    vi.resetAllMocks();
  });

  it('createBoard creates the board and 3 default columns sequentially', async () => {
    vi.mocked(boardsApi.createBoard).mockResolvedValue({
      id: 'board-1',
      organizationId: 'org-1',
      name: 'Sprint 1',
      description: null,
    });
    vi.mocked(columnsApi.createColumn).mockImplementation((boardId, name) =>
      Promise.resolve({ id: `col-${name}`, boardId, name, order: 0 }),
    );

    const board = await useBoardsStore.getState().createBoard('org-1', 'Sprint 1');

    expect(board.id).toBe('board-1');
    expect(columnsApi.createColumn).toHaveBeenCalledTimes(3);
    expect(columnsApi.createColumn).toHaveBeenNthCalledWith(1, 'board-1', 'A Fazer');
    expect(columnsApi.createColumn).toHaveBeenNthCalledWith(2, 'board-1', 'Em Progresso');
    expect(columnsApi.createColumn).toHaveBeenNthCalledWith(3, 'board-1', 'Concluído');
    expect(useBoardsStore.getState().columnsByBoard['board-1']).toHaveLength(3);
  });

  it('updateBoard replaces the board in place within its organization list', async () => {
    useBoardsStore.setState({
      boardsByOrg: {
        'org-1': [{ id: 'board-1', organizationId: 'org-1', name: 'Sprint 1', description: null }],
      },
    });
    vi.mocked(boardsApi.updateBoard).mockResolvedValue({
      id: 'board-1',
      organizationId: 'org-1',
      name: 'Sprint 2',
      description: 'Nova descrição',
    });

    const updated = await useBoardsStore
      .getState()
      .updateBoard('org-1', 'board-1', { name: 'Sprint 2', description: 'Nova descrição' });

    expect(boardsApi.updateBoard).toHaveBeenCalledWith('board-1', {
      name: 'Sprint 2',
      description: 'Nova descrição',
    });
    expect(useBoardsStore.getState().boardsByOrg['org-1']).toEqual([updated]);
  });

  it('deleteBoard removes the board and cleans up its columns/tasks from local state', async () => {
    useBoardsStore.setState({
      boardsByOrg: {
        'org-1': [
          { id: 'board-1', organizationId: 'org-1', name: 'Sprint 1', description: null },
          { id: 'board-2', organizationId: 'org-1', name: 'Sprint 2', description: null },
        ],
      },
      columnsByBoard: {
        'board-1': [{ id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 }],
      },
      tasksByColumn: {
        'col-1': [makeTask('task-1', 'col-1', 0)],
      },
    });
    vi.mocked(boardsApi.deleteBoard).mockResolvedValue(undefined);

    await useBoardsStore.getState().deleteBoard('org-1', 'board-1');

    expect(boardsApi.deleteBoard).toHaveBeenCalledWith('board-1');
    const state = useBoardsStore.getState();
    expect(state.boardsByOrg['org-1'].map((b) => b.id)).toEqual(['board-2']);
    expect(state.columnsByBoard['board-1']).toBeUndefined();
    expect(state.tasksByColumn['col-1']).toBeUndefined();
  });

  it('fetchBoardData loads columns and sorts each column tasks by order', async () => {
    vi.mocked(columnsApi.listColumns).mockResolvedValue([
      { id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 },
    ]);
    vi.mocked(tasksApi.listTasksByColumn).mockResolvedValue([
      makeTask('t2', 'col-1', 1),
      makeTask('t1', 'col-1', 0),
    ]);

    await useBoardsStore.getState().fetchBoardData('board-1');

    expect(useBoardsStore.getState().tasksByColumn['col-1'].map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('moveTask calls the move endpoint and refreshes both affected columns, sorted by order', async () => {
    vi.mocked(tasksApi.moveTask).mockResolvedValue(makeTask('t1', 'col-2', 0));
    vi.mocked(tasksApi.listTasksByColumn)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeTask('t3', 'col-2', 1), makeTask('t1', 'col-2', 0)]);

    await useBoardsStore.getState().moveTask('t1', 'col-1', 'col-2', 0);

    expect(tasksApi.moveTask).toHaveBeenCalledWith('t1', 'col-2', 0);
    expect(useBoardsStore.getState().tasksByColumn['col-2'].map((t) => t.id)).toEqual(['t1', 't3']);
    expect(useBoardsStore.getState().tasksByColumn['col-1']).toEqual([]);
  });

  it('reorderColumns replaces the board columns with the server response', async () => {
    const reordered = [
      { id: 'col-2', boardId: 'board-1', name: 'Em Progresso', order: 0 },
      { id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 1 },
    ];
    vi.mocked(columnsApi.reorderColumn).mockResolvedValue(reordered);

    await useBoardsStore.getState().reorderColumns('board-1', 'col-2', 0);

    expect(useBoardsStore.getState().columnsByBoard['board-1']).toEqual(reordered);
  });

  it('fetchBoards loads the boards of an organization', async () => {
    vi.mocked(boardsApi.listBoards).mockResolvedValue([
      { id: 'board-1', organizationId: 'org-1', name: 'Sprint 1', description: null },
    ]);

    await useBoardsStore.getState().fetchBoards('org-1');

    expect(useBoardsStore.getState().boardsByOrg['org-1']).toHaveLength(1);
  });

  it('createColumn appends the new column and initializes its empty task list', async () => {
    vi.mocked(columnsApi.createColumn).mockResolvedValue({
      id: 'col-new',
      boardId: 'board-1',
      name: 'Revisão',
      order: 3,
    });

    await useBoardsStore.getState().createColumn('board-1', 'Revisão');

    expect(useBoardsStore.getState().columnsByBoard['board-1']).toEqual([
      { id: 'col-new', boardId: 'board-1', name: 'Revisão', order: 3 },
    ]);
    expect(useBoardsStore.getState().tasksByColumn['col-new']).toEqual([]);
  });

  it('createTask appends the created task to its column, sorted by order', async () => {
    useBoardsStore.setState({ tasksByColumn: { 'col-1': [makeTask('t1', 'col-1', 0)] } });
    vi.mocked(tasksApi.createTask).mockResolvedValue(makeTask('t2', 'col-1', 1));

    await useBoardsStore.getState().createTask('col-1', { title: 'Nova tarefa' });

    expect(useBoardsStore.getState().tasksByColumn['col-1'].map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('updateTask replaces the task in place within its column', async () => {
    useBoardsStore.setState({ tasksByColumn: { 'col-1': [makeTask('t1', 'col-1', 0)] } });
    const updated = { ...makeTask('t1', 'col-1', 0), title: 'Atualizada' };
    vi.mocked(tasksApi.updateTask).mockResolvedValue(updated);

    const result = await useBoardsStore.getState().updateTask('t1', 'col-1', { title: 'Atualizada' });

    expect(useBoardsStore.getState().tasksByColumn['col-1']).toEqual([updated]);
    expect(result).toEqual(updated);
  });

  it('deleteTask removes the task from local state after the API call succeeds', async () => {
    useBoardsStore.setState({
      tasksByColumn: { 'col-1': [makeTask('t1', 'col-1', 0)] },
    });
    vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined);

    await useBoardsStore.getState().deleteTask('t1', 'col-1');

    expect(useBoardsStore.getState().tasksByColumn['col-1']).toEqual([]);
  });

  it('deleteColumn calls the API and refetches the board data (RN-004 is server-side)', async () => {
    vi.mocked(columnsApi.deleteColumn).mockResolvedValue(undefined);
    vi.mocked(columnsApi.listColumns).mockResolvedValue([
      { id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 },
    ]);
    vi.mocked(tasksApi.listTasksByColumn).mockResolvedValue([]);

    await useBoardsStore.getState().deleteColumn('board-1', 'col-2');

    expect(columnsApi.deleteColumn).toHaveBeenCalledWith('col-2');
    expect(useBoardsStore.getState().columnsByBoard['board-1']).toEqual([
      { id: 'col-1', boardId: 'board-1', name: 'A Fazer', order: 0 },
    ]);
  });
});
