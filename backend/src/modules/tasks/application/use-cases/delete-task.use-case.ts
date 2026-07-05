import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { ColumnRepository, COLUMN_REPOSITORY } from '../../../columns/application/ports/column-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

export interface DeleteTaskInput {
  requesterId: string;
  taskId: string;
}

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
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

    await this.taskRepository.delete(input.taskId);
  }
}
