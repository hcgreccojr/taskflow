import { Inject, Injectable } from '@nestjs/common';
import { TaskAccessService } from '../services/task-access.service';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

export interface DeleteTaskInput {
  requesterId: string;
  taskId: string;
}

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
    await this.taskAccessService.resolve(input.taskId, input.requesterId);
    await this.taskRepository.delete(input.taskId);
  }
}
