import { Injectable } from '@nestjs/common';
import { Priority as PrismaPriority } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Task, TaskPriority } from '../domain/task.entity';
import {
  CreateTaskData,
  PaginatedTasks,
  TaskFilters,
  TaskPositionUpdate,
  TaskRepository,
  UpdateTaskData,
} from '../application/ports/task-repository.port';

interface TaskRow {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  dueDate: Date | null;
  order: number;
  priority: PrismaPriority;
  createdAt: Date;
}

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskData): Promise<Task> {
    const row = await this.prisma.task.create({
      data: {
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        order: data.order,
        priority: data.priority,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByColumnId(columnId: string): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    const row = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        priority: data.priority,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async updatePositions(updates: TaskPositionUpdate[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, columnId, order }) =>
        this.prisma.task.update({ where: { id }, data: { columnId, order } }),
      ),
    );
  }

  async findMany(filters: TaskFilters): Promise<PaginatedTasks> {
    const where = {
      column: {
        board: {
          organization: {
            memberships: { some: { userId: filters.requesterId } },
          },
        },
      },
      assigneeId: filters.assigneeId,
      columnId: filters.columnId,
      dueDate: filters.dueBefore ? { lte: filters.dueBefore } : undefined,
      title: filters.search ? { contains: filters.search, mode: 'insensitive' as const } : undefined,
    };

    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data: rows.map((row) => this.toDomain(row)), total };
  }

  private toDomain(row: TaskRow): Task {
    return new Task(
      row.id,
      row.columnId,
      row.title,
      row.description,
      row.assigneeId,
      row.dueDate,
      row.order,
      row.priority as unknown as TaskPriority,
      row.createdAt,
    );
  }
}
