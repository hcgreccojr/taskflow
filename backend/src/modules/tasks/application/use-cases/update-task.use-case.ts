import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { ColumnRepository, COLUMN_REPOSITORY } from '../../../columns/application/ports/column-repository.port';
import {
  MembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../../../organizations/application/ports/membership-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Task, TaskPriority } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

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
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    private readonly activityLogRecorder: ActivityLogRecorderService,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const column = await this.columnRepository.findById(task.columnId);
    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    const board = await this.boardRepository.findById(column.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

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

    return updated;
  }
}
