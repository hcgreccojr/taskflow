import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { TaskRepository, TASK_REPOSITORY } from '../../../tasks/application/ports/task-repository.port';
import { RealtimeNotifier, REALTIME_NOTIFIER } from '../../../realtime/application/ports/realtime-notifier.port';
import { ColumnRepository, COLUMN_REPOSITORY } from '../ports/column-repository.port';

export interface DeleteColumnInput {
  requesterId: string;
  columnId: string;
}

/**
 * RN-004: ao excluir uma coluna, todas as tarefas nela contidas são movidas
 * para a primeira coluna restante do quadro; se não houver nenhuma outra
 * coluna, a exclusão é bloqueada (400).
 */
@Injectable()
export class DeleteColumnUseCase {
  constructor(
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(REALTIME_NOTIFIER) private readonly realtimeNotifier: RealtimeNotifier,
  ) {}

  async execute(input: DeleteColumnInput): Promise<void> {
    const column = await this.columnRepository.findById(input.columnId);
    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    const board = await this.boardRepository.findById(column.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

    const siblings = await this.columnRepository.findByBoardId(column.boardId);
    const remaining = siblings.filter((sibling) => sibling.id !== column.id);

    if (remaining.length === 0) {
      throw new BadRequestException('Não é possível excluir a única coluna do quadro');
    }

    const destination = remaining[0];

    const tasksToMove = await this.taskRepository.findByColumnId(column.id);
    if (tasksToMove.length > 0) {
      const destinationTasks = await this.taskRepository.findByColumnId(destination.id);
      const updates = [
        ...destinationTasks.map((task, index) => ({
          id: task.id,
          columnId: destination.id,
          order: index,
        })),
        ...tasksToMove.map((task, index) => ({
          id: task.id,
          columnId: destination.id,
          order: destinationTasks.length + index,
        })),
      ];
      await this.taskRepository.updatePositions(updates);
    }

    await this.columnRepository.delete(column.id);
    await this.columnRepository.updateOrders(
      remaining.map((sibling, index) => ({ id: sibling.id, order: index })),
    );

    this.realtimeNotifier.notifyBoardEvent(board.id, {
      type: 'column.deleted',
      payload: { columnId: column.id },
    });
  }
}
