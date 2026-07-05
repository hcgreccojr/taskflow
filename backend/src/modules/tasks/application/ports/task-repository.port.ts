import { Task, TaskPriority } from '../../domain/task.entity';

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface CreateTaskData {
  columnId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  order: number;
  priority?: TaskPriority;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
}

export interface TaskPositionUpdate {
  id: string;
  columnId: string;
  order: number;
}

export interface TaskFilters {
  requesterId: string;
  assigneeId?: string;
  columnId?: string;
  dueBefore?: Date;
  search?: string;
}

export interface TaskRepository {
  create(data: CreateTaskData): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  /** Ordenadas por `order` ascendente. */
  findByColumnId(columnId: string): Promise<Task[]>;
  update(id: string, data: UpdateTaskData): Promise<Task>;
  delete(id: string): Promise<void>;
  /** Persiste `columnId`+`order` de várias tarefas numa única transação. */
  updatePositions(updates: TaskPositionUpdate[]): Promise<void>;
  findMany(filters: TaskFilters): Promise<Task[]>;
}
