import { create } from 'zustand';
import * as boardsApi from '../../../services/boardsApi';
import * as columnsApi from '../../../services/columnsApi';
import * as tasksApi from '../../../services/tasksApi';
import type { CreateTaskInput, UpdateTaskInput } from '../../../services/tasksApi';
import type { Board, Column, Task } from '../../../shared/types/api';

const DEFAULT_COLUMN_NAMES = ['A Fazer', 'Em Progresso', 'Concluído'];

function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order);
}

interface BoardsState {
  boardsByOrg: Record<string, Board[]>;
  columnsByBoard: Record<string, Column[]>;
  tasksByColumn: Record<string, Task[]>;
  loading: boolean;

  fetchBoards: (organizationId: string) => Promise<void>;
  createBoard: (organizationId: string, name: string, description?: string) => Promise<Board>;
  fetchBoardData: (boardId: string) => Promise<void>;
  createColumn: (boardId: string, name: string) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string) => Promise<void>;

  createTask: (columnId: string, input: CreateTaskInput) => Promise<void>;
  updateTask: (taskId: string, columnId: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (taskId: string, columnId: string) => Promise<void>;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, order: number) => Promise<void>;
  reorderColumns: (boardId: string, columnId: string, order: number) => Promise<void>;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boardsByOrg: {},
  columnsByBoard: {},
  tasksByColumn: {},
  loading: false,

  fetchBoards: async (organizationId) => {
    set({ loading: true });
    try {
      const boards = await boardsApi.listBoards(organizationId);
      set((state) => ({ boardsByOrg: { ...state.boardsByOrg, [organizationId]: boards }, loading: false }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createBoard: async (organizationId, name, description) => {
    const board = await boardsApi.createBoard({ organizationId, name, description });
    set((state) => ({
      boardsByOrg: {
        ...state.boardsByOrg,
        [organizationId]: [...(state.boardsByOrg[organizationId] ?? []), board],
      },
    }));

    const columns: Column[] = [];
    for (const columnName of DEFAULT_COLUMN_NAMES) {
      columns.push(await columnsApi.createColumn(board.id, columnName));
    }
    set((state) => ({
      columnsByBoard: { ...state.columnsByBoard, [board.id]: columns },
      tasksByColumn: {
        ...state.tasksByColumn,
        ...Object.fromEntries(columns.map((column) => [column.id, []])),
      },
    }));

    return board;
  },

  fetchBoardData: async (boardId) => {
    set({ loading: true });
    try {
      const columns = await columnsApi.listColumns(boardId);
      set((state) => ({ columnsByBoard: { ...state.columnsByBoard, [boardId]: columns } }));

      const taskLists = await Promise.all(columns.map((column) => tasksApi.listTasksByColumn(column.id)));
      set((state) => {
        const tasksByColumn = { ...state.tasksByColumn };
        columns.forEach((column, index) => {
          tasksByColumn[column.id] = sortByOrder(taskLists[index]);
        });
        return { tasksByColumn, loading: false };
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createColumn: async (boardId, name) => {
    const column = await columnsApi.createColumn(boardId, name);
    set((state) => ({
      columnsByBoard: { ...state.columnsByBoard, [boardId]: [...(state.columnsByBoard[boardId] ?? []), column] },
      tasksByColumn: { ...state.tasksByColumn, [column.id]: [] },
    }));
  },

  createTask: async (columnId, input) => {
    const task = await tasksApi.createTask(columnId, input);
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]: sortByOrder([...(state.tasksByColumn[columnId] ?? []), task]),
      },
    }));
  },

  updateTask: async (taskId, columnId, input) => {
    const updated = await tasksApi.updateTask(taskId, input);
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]: (state.tasksByColumn[columnId] ?? []).map((task) =>
          task.id === taskId ? updated : task,
        ),
      },
    }));
    return updated;
  },

  deleteTask: async (taskId, columnId) => {
    await tasksApi.deleteTask(taskId);
    set((state) => ({
      tasksByColumn: {
        ...state.tasksByColumn,
        [columnId]: (state.tasksByColumn[columnId] ?? []).filter((task) => task.id !== taskId),
      },
    }));
  },

  moveTask: async (taskId, fromColumnId, toColumnId, order) => {
    await tasksApi.moveTask(taskId, toColumnId, order);
    const fromTasks = sortByOrder(await tasksApi.listTasksByColumn(fromColumnId));
    const toTasks =
      fromColumnId === toColumnId ? fromTasks : sortByOrder(await tasksApi.listTasksByColumn(toColumnId));
    set((state) => ({
      tasksByColumn: { ...state.tasksByColumn, [fromColumnId]: fromTasks, [toColumnId]: toTasks },
    }));
  },

  reorderColumns: async (boardId, columnId, order) => {
    const columns = await columnsApi.reorderColumn(columnId, order);
    set((state) => ({ columnsByBoard: { ...state.columnsByBoard, [boardId]: columns } }));
  },

  deleteColumn: async (boardId, columnId) => {
    await columnsApi.deleteColumn(columnId);
    // O backend já move as tarefas restantes para a primeira coluna e
    // reindexa as demais (RN-004) — refazer o fetch garante estado consistente
    // sem duplicar essa lógica no frontend.
    await get().fetchBoardData(boardId);
  },
}));
