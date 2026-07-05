import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  MembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../../../organizations/application/ports/membership-repository.port';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { RealtimeNotifier, REALTIME_NOTIFIER } from '../../../realtime/application/ports/realtime-notifier.port';
import { Task, TaskPriority } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';
import { TaskAccessService } from '../services/task-access.service';

export interface UpdateTaskInput {
  requesterId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
}

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    private readonly activityLogRecorder: ActivityLogRecorderService,
    private readonly taskAccessService: TaskAccessService,
    @Inject(REALTIME_NOTIFIER) private readonly realtimeNotifier: RealtimeNotifier,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const { task, board } = await this.taskAccessService.resolve(input.taskId, input.requesterId);

    if (input.assigneeId) {
      const assigneeMembership = await this.membershipRepository.findByUserAndOrganization(
        input.assigneeId,
        board.organizationId,
      );
      if (!assigneeMembership) {
        throw new UnprocessableEntityException(
          'O responsável informado não é membro desta organização',
        );
      }
    }

    const updatedFields: string[] = [];
    if (input.title !== undefined && input.title !== task.title) {
      updatedFields.push('título');
    }
    if (input.description !== undefined && input.description !== task.description) {
      updatedFields.push('descrição');
    }
    if (
      input.dueDate !== undefined &&
      (input.dueDate?.getTime() ?? null) !== (task.dueDate?.getTime() ?? null)
    ) {
      updatedFields.push('prazo');
    }
    if (input.priority !== undefined && input.priority !== task.priority) {
      updatedFields.push('prioridade');
    }
    const assigneeChanged = input.assigneeId !== undefined && input.assigneeId !== task.assigneeId;

    const updated = await this.taskRepository.update(input.taskId, {
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
    });

    if (updatedFields.length > 0) {
      await this.activityLogRecorder.recordFieldsUpdated(task.id, input.requesterId, updatedFields);
    }
    if (assigneeChanged) {
      await this.activityLogRecorder.recordAssigned(task.id, input.requesterId);
    }

    this.realtimeNotifier.notifyBoardEvent(board.id, { type: 'task.updated', payload: updated });

    return updated;
  }
}
