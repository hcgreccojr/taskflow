import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { ColumnRepository, COLUMN_REPOSITORY } from '../../../columns/application/ports/column-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';

export interface TaskAccessResult {
  task: Task;
  column: Column;
  board: Board;
}

@Injectable()
export class TaskAccessService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async resolve(taskId: string, requesterId: string): Promise<TaskAccessResult> {
    const task = await this.taskRepository.findById(taskId);
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

    await this.membershipChecker.assertMember(requesterId, board.organizationId);

    return { task, column, board };
  }
}
