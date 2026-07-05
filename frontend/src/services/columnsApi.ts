import { request } from './httpClient';
import type { Column } from '../shared/types/api';

export function listColumns(boardId: string): Promise<Column[]> {
  return request(`/boards/${boardId}/columns`);
}

export function createColumn(boardId: string, name: string): Promise<Column> {
  return request(`/boards/${boardId}/columns`, { method: 'POST', body: { name } });
}

/** Retorna TODAS as colunas do board, já reordenadas (não só a movida). */
export function reorderColumn(columnId: string, order: number): Promise<Column[]> {
  return request(`/columns/${columnId}/reorder`, { method: 'PATCH', body: { order } });
}

/** RN-004: tarefas são movidas para a primeira coluna restante; 400 se for a única coluna do quadro. */
export function deleteColumn(columnId: string): Promise<void> {
  return request(`/columns/${columnId}`, { method: 'DELETE' });
}
