import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ColumnRepository, COLUMN_REPOSITORY } from '../../../columns/application/ports/column-repository.port';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { RealtimeNotifier, REALTIME_NOTIFIER } from '../../../realtime/application/ports/realtime-notifier.port';
import { Task } from '../../domain/task.entity';
import { TaskRepository, TASK_REPOSITORY } from '../ports/task-repository.port';
import { TaskAccessService } from '../services/task-access.service';

export interface MoveTaskInput {
  requesterId: string;
  taskId: string;
  columnId: string;
  order?: number;
}

@Injectable()
export class MoveTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepository: TaskRepository,
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    private readonly activityLogRecorder: ActivityLogRecorderService,
    private readonly taskAccessService: TaskAccessService,
    @Inject(REALTIME_NOTIFIER) private readonly realtimeNotifier: RealtimeNotifier,
  ) {}

  async execute(input: MoveTaskInput): Promise<Task> {
    const { task, column: sourceColumn, board } = await this.taskAccessService.resolve(
      input.taskId,
      input.requesterId,
    );

    const targetColumn = await this.columnRepository.findById(input.columnId);
    if (!targetColumn) {
      throw new NotFoundException('Coluna de destino não encontrada');
    }

    if (sourceColumn.boardId !== targetColumn.boardId) {
      throw new BadRequestException(
        'Não é permitido mover uma tarefa para uma coluna de outro quadro',
      );
    }

    if (task.columnId === targetColumn.id) {
      const reordered = await this.reorderWithinColumn(task, input.order);
      this.realtimeNotifier.notifyBoardEvent(board.id, { type: 'task.moved', payload: reordered });
      return reordered;
    }

    const moved = await this.moveAcrossColumns(task, targetColumn.id, input.order);
    await this.activityLogRecorder.recordStatusChanged(task.id, input.requesterId);
    this.realtimeNotifier.notifyBoardEvent(board.id, { type: 'task.moved', payload: moved });
    return moved;
  }

  private async reorderWithinColumn(task: Task, order?: number): Promise<Task> {
    const siblings = await this.taskRepository.findByColumnId(task.columnId);
    const withoutMoved = siblings.filter((sibling) => sibling.id !== task.id);

    const targetIndex = Math.min(Math.max(order ?? withoutMoved.length, 0), withoutMoved.length);
    withoutMoved.splice(targetIndex, 0, task);

    const updates = withoutMoved.map((sibling, index) => ({
      id: sibling.id,
      columnId: task.columnId,
      order: index,
    }));
    await this.taskRepository.updatePositions(updates);

    return new Task(
      task.id,
      task.columnId,
      task.title,
      task.description,
      task.assigneeId,
      task.dueDate,
      targetIndex,
      task.priority,
      task.createdAt,
    );
  }

  private async moveAcrossColumns(task: Task, targetColumnId: string, order?: number): Promise<Task> {
    const sourceSiblings = (await this.taskRepository.findByColumnId(task.columnId)).filter(
      (sibling) => sibling.id !== task.id,
    );
    const targetSiblings = await this.taskRepository.findByColumnId(targetColumnId);

    const targetIndex = Math.min(Math.max(order ?? targetSiblings.length, 0), targetSiblings.length);
    targetSiblings.splice(targetIndex, 0, task);

    const sourceUpdates = sourceSiblings.map((sibling, index) => ({
      id: sibling.id,
      columnId: task.columnId,
      order: index,
    }));
    const targetUpdates = targetSiblings.map((sibling, index) => ({
      id: sibling.id,
      columnId: targetColumnId,
      order: index,
    }));

    await this.taskRepository.updatePositions([...sourceUpdates, ...targetUpdates]);

    return new Task(
      task.id,
      targetColumnId,
      task.title,
      task.description,
      task.assigneeId,
      task.dueDate,
      targetIndex,
      task.priority,
      task.createdAt,
    );
  }
}
