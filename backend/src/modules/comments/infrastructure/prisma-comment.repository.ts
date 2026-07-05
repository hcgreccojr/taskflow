import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Comment } from '../domain/comment.entity';
import { CommentRepository, CreateCommentData } from '../application/ports/comment-repository.port';

interface CommentRow {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentData): Promise<Comment> {
    const row = await this.prisma.comment.create({
      data: { taskId: data.taskId, authorId: data.authorId, content: data.content },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Comment | null> {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const rows = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async update(id: string, content: string): Promise<Comment> {
    const row = await this.prisma.comment.update({ where: { id }, data: { content } });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  private toDomain(row: CommentRow): Comment {
    return new Comment(row.id, row.taskId, row.authorId, row.content, row.createdAt);
  }
}
