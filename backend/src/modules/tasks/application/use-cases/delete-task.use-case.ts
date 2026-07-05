import { Inject, Injectable } from '@nestjs/common';
import { RealtimeNotifier, REALTIME_NOTIFIER } from '../../../realtime/application/ports/realtime-notifier.port';
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
    @Inject(REALTIME_NOTIFIER) private readonly realtimeNotifier: RealtimeNotifier,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
    const { task, board } = await this.taskAccessService.resolve(input.taskId, input.requesterId);
    await this.taskRepository.delete(input.taskId);
    this.realtimeNotifier.notifyBoardEvent(board.id, { type: 'task.deleted', payload: { taskId: task.id } });
  }
}
