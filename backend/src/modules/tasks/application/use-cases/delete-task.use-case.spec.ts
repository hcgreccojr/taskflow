import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteTaskUseCase } from './delete-task.use-case';
import { TaskAccessService } from '../services/task-access.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('DeleteTaskUseCase', () => {
  let useCase: DeleteTaskUseCase;
  let taskRepository: { findById: jest.Mock; delete: jest.Mock };
  let taskAccessService: { resolve: jest.Mock };
  let realtimeNotifier: { notifyBoardEvent: jest.Mock };

  const existingTask = new Task(
    'task-1',
    'col-1',
    'Tarefa',
    null,
    null,
    null,
    0,
    TaskPriority.MEDIUM,
    new Date(),
  );
  const column = new Column('col-1', 'board-1', 'A Fazer', 0);
  const board = new Board('board-1', 'org-1', 'Sprint 1', null);

  beforeEach(() => {
    taskRepository = { findById: jest.fn().mockResolvedValue(existingTask), delete: jest.fn() };
    taskAccessService = {
      resolve: jest.fn().mockResolvedValue({ task: existingTask, column, board }),
    };
    realtimeNotifier = { notifyBoardEvent: jest.fn() };
    useCase = new DeleteTaskUseCase(
      taskRepository as any,
      taskAccessService as unknown as TaskAccessService,
      realtimeNotifier as any,
    );
  });

  it('propagates NotFoundException from TaskAccessService when the task does not exist', async () => {
    taskAccessService.resolve.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(taskRepository.delete).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    taskAccessService.resolve.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'task-1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(taskRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the task when the requester is a member', async () => {
    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1' });

    expect(taskAccessService.resolve).toHaveBeenCalledWith('task-1', 'user-1');
    expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
    expect(realtimeNotifier.notifyBoardEvent).toHaveBeenCalledWith('board-1', {
      type: 'task.deleted',
      payload: { taskId: 'task-1' },
    });
  });
});
