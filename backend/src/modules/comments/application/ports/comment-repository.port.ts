import { Comment } from '../../domain/comment.entity';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface CreateCommentData {
  taskId: string;
  authorId: string;
  content: string;
}

export interface CommentRepository {
  create(data: CreateCommentData): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  /** Ordenados por `createdAt` ascendente (ordem cronológica da conversa). */
  findByTaskId(taskId: string): Promise<Comment[]>;
  update(id: string, content: string): Promise<Comment>;
  delete(id: string): Promise<void>;
}
