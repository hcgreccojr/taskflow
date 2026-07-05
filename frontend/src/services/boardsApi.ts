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
