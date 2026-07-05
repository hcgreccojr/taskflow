import { Inject, Injectable } from '@nestjs/common';
import { Task } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

export interface ListTasksInput {
  requesterId: string;
  assigneeId?: string;
  columnId?: string;
  dueBefore?: Date;
  search?: string;
}

@Injectable()
export class ListTasksUseCase {
  constructor(@Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<Task[]> {
    return this.taskRepository.findMany({
      requesterId: input.requesterId,
      assigneeId: input.assigneeId,
      columnId: input.columnId,
      dueBefore: input.dueBefore,
      search: input.search,
    });
  }
}
