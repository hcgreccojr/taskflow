import { request } from './httpClient';
import type { ActivityLog, Task, TaskPriority } from '../shared/types/api';

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
 */
export function listTasksByColumn(columnId: string): Promise<Task[]> {
  return request('/tasks', { query: { status: columnId } });
}

export function listTasks(filters: {
  assigneeId?: string;
  dueBefore?: string;
  search?: string;
}): Promise<Task[]> {
  return request('/tasks', { query: filters });
}

export function getTaskActivity(taskId: string): Promise<ActivityLog[]> {
  return request(`/tasks/${taskId}/activity`);
}
