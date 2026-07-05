import { request } from './httpClient';
import type { Comment } from '../shared/types/api';

export function listComments(taskId: string): Promise<Comment[]> {
  return request(`/tasks/${taskId}/comments`);
}

export function createComment(taskId: string, content: string): Promise<Comment> {
  return request(`/tasks/${taskId}/comments`, { method: 'POST', body: { content } });
}

export function updateComment(commentId: string, content: string): Promise<Comment> {
  return request(`/comments/${commentId}`, { method: 'PATCH', body: { content } });
}

export function deleteComment(commentId: string): Promise<void> {
  return request(`/comments/${commentId}`, { method: 'DELETE' });
}
