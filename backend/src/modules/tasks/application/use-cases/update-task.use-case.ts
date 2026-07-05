import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { ColumnRepository, COLUMN_REPOSITORY } from '../../../columns/application/ports/column-repository.port';
import {
  MembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../../../organizations/application/ports/membership-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
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

    return this.taskRepository.update(input.taskId, {
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
    });
  }
}
