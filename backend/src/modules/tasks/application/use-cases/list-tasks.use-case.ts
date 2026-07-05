import { Inject, Injectable } from '@nestjs/common';
import { Task } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

export interface ListTasksInput {
  requesterId: string;
  assigneeId?: string;
  columnId?: string;
  dueBefore?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListTasksOutput {
  data: Task[];
  meta: PaginationMeta;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class ListTasksUseCase {
  constructor(@Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<ListTasksOutput> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit = Math.min(input.limit && input.limit > 0 ? input.limit : DEFAULT_LIMIT, MAX_LIMIT);

    const { data, total } = await this.taskRepository.findMany({
      requesterId: input.requesterId,
      assigneeId: input.assigneeId,
      columnId: input.columnId,
      dueBefore: input.dueBefore,
      search: input.search,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
