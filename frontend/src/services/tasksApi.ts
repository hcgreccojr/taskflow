import { request } from './httpClient';
import type { ActivityLog, Task, TaskPriority } from '../shared/types/api';

interface PaginatedTasksResponse {
  data: Task[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export function createTask(columnId: string, data: CreateTaskInput): Promise<Task> {
  return request(`/columns/${columnId}/tasks`, { method: 'POST', body: data });
}

export function updateTask(taskId: string, data: UpdateTaskInput): Promise<Task> {
  return request(`/tasks/${taskId}`, { method: 'PATCH', body: data });
}

export function moveTask(taskId: string, columnId: string, order?: number): Promise<Task> {
  return request(`/tasks/${taskId}/move`, { method: 'PATCH', body: { columnId, order } });
}

export function deleteTask(taskId: string): Promise<void> {
  return request(`/tasks/${taskId}`, { method: 'DELETE' });
}

/**
 * O nome do query param no backend é "status", mas semanticamente filtra pelo columnId
 * exato (não existe Task.status no modelo de dados — a coluna representa o estágio).
 *
 * GET /tasks é paginado (RNF-003); aqui usamos o limite máximo (100) para preservar
 * o comportamento anterior de "todas as tarefas da coluna" no board Kanban, já que a
 * reordenação por drag-and-drop depende do conjunto completo.
 */
export async function listTasksByColumn(columnId: string): Promise<Task[]> {
  const response = await request<PaginatedTasksResponse>('/tasks', {
    query: { status: columnId, limit: '100' },
  });
  return response.data;
}

export async function listTasks(filters: {
  assigneeId?: string;
  dueBefore?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Task[]> {
  const { page, limit, ...rest } = filters;
  const response = await request<PaginatedTasksResponse>('/tasks', {
    query: {
      ...rest,
      page: page !== undefined ? String(page) : undefined,
      limit: limit !== undefined ? String(limit) : undefined,
    },
  });
  return response.data;
}

export function getTaskActivity(taskId: string): Promise<ActivityLog[]> {
  return request(`/tasks/${taskId}/activity`);
}
