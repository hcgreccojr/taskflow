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

export interface CreateTaskInput {
  requesterId: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
}

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const column = await this.columnRepository.findById(input.columnId);
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

    const existingTasks = await this.taskRepository.findByColumnId(input.columnId);

    return this.taskRepository.create({
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
      order: existingTasks.length,
    });
  }
}
