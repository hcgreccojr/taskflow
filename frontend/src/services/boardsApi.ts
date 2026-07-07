import { request } from './httpClient';
import type { Board } from '../shared/types/api';

export function listBoards(organizationId: string): Promise<Board[]> {
  return request('/boards', { query: { organizationId } });
}

export function createBoard(data: {
  organizationId: string;
  name: string;
  description?: string;
}): Promise<Board> {
  return request('/boards', { method: 'POST', body: data });
}

export function updateBoard(
  boardId: string,
  data: { name?: string; description?: string },
): Promise<Board> {
  return request(`/boards/${boardId}`, { method: 'PATCH', body: data });
}

/** Exclusão em cascata (colunas e tarefas); apenas ADMIN da organização pode. */
export function deleteBoard(boardId: string): Promise<void> {
  return request(`/boards/${boardId}`, { method: 'DELETE' });
}
