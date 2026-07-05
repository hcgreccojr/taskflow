import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MoveTaskUseCase } from './move-task.use-case';
import { TaskAccessService } from '../services/task-access.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('MoveTaskUseCase', () => {
  let useCase: MoveTaskUseCase;
  let taskRepository: { findById: jest.Mock; findByColumnId: jest.Mock; updatePositions: jest.Mock };
  let columnRepository: { findById: jest.Mock };
  let activityLogRecorder: { recordStatusChanged: jest.Mock };
  let taskAccessService: { resolve: jest.Mock };
  let realtimeNotifier: { notifyBoardEvent: jest.Mock };

  const board = new Board('board-1', 'org-1', 'Sprint 1', null);
  const sourceColumn = new Column('col-source', 'board-1', 'A Fazer', 0);
  const targetColumn = new Column('col-target', 'board-1', 'Em Progresso', 1);
  const otherBoardColumn = new Column('col-other-board', 'board-2', 'Backlog', 0);

  const makeTask = (id: string, columnId: string, order: number) =>
    new Task(id, columnId, `Tarefa ${id}`, null, null, null, order, TaskPriority.MEDIUM, new Date());

  beforeEach(() => {
    taskRepository = { findById: jest.fn(), findByColumnId: jest.fn(), updatePositions: jest.fn() };
    columnRepository = { findById: jest.fn() };
    activityLogRecorder = { recordStatusChanged: jest.fn().mockResolvedValue(undefined) };
    taskAccessService = { resolve: jest.fn() };
    realtimeNotifier = { notifyBoardEvent: jest.fn() };
    useCase = new MoveTaskUseCase(
      taskRepository as any,
      columnRepository as any,
      activityLogRecorder as unknown as ActivityLogRecorderService,
      taskAccessService as unknown as TaskAccessService,
      realtimeNotifier as any,
    );
  });

  it('propagates NotFoundException from TaskAccessService when the task does not exist', async () => {
    taskAccessService.resolve.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'missing', columnId: 'col-target' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    taskAccessService.resolve.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: task.id, columnId: 'col-target' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(columnRepository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the destination column does not exist', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects moving the task to a column of another board', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(otherBoardColumn);

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-other-board' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moves the task to the end of another column in the same board and compacts the source column', async () => {
    const task = makeTask('task-1', 'col-source', 1);
    const sourceSiblings = [makeTask('task-0', 'col-source', 0), task, makeTask('task-2', 'col-source', 2)];
    const targetSiblings = [makeTask('task-t0', 'col-target', 0)];

    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(targetColumn);
    taskRepository.findByColumnId.mockImplementation((columnId: string) => {
      if (columnId === 'col-source') return Promise.resolve(sourceSiblings);
      if (columnId === 'col-target') return Promise.resolve(targetSiblings);
      return Promise.resolve([]);
    });

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-target' });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 'task-0', columnId: 'col-source', order: 0 },
      { id: 'task-2', columnId: 'col-source', order: 1 },
      { id: 'task-t0', columnId: 'col-target', order: 0 },
      { id: 'task-1', columnId: 'col-target', order: 1 },
    ]);
    expect(result.columnId).toBe('col-target');
    expect(result.order).toBe(1);
    expect(activityLogRecorder.recordStatusChanged).toHaveBeenCalledWith('task-1', 'user-1');
    expect(realtimeNotifier.notifyBoardEvent).toHaveBeenCalledWith('board-1', {
      type: 'task.moved',
      payload: result,
    });
  });

  it('moves the task to a specific position in the middle of another column', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    const sourceSiblings = [task];
    const targetSiblings = [
      makeTask('task-t0', 'col-target', 0),
      makeTask('task-t1', 'col-target', 1),
    ];

    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(targetColumn);
    taskRepository.findByColumnId.mockImplementation((columnId: string) => {
      if (columnId === 'col-source') return Promise.resolve(sourceSiblings);
      if (columnId === 'col-target') return Promise.resolve(targetSiblings);
      return Promise.resolve([]);
    });

    const result = await useCase.execute({
      requesterId: 'user-1',
      taskId: 'task-1',
      columnId: 'col-target',
      order: 1,
    });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 'task-t0', columnId: 'col-target', order: 0 },
      { id: 'task-1', columnId: 'col-target', order: 1 },
      { id: 'task-t1', columnId: 'col-target', order: 2 },
    ]);
    expect(result.order).toBe(1);
  });

  it('reorders within the same column when the target column equals the current one', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    const siblings = [task, makeTask('task-2', 'col-source', 1), makeTask('task-3', 'col-source', 2)];

    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(sourceColumn);
    taskRepository.findByColumnId.mockResolvedValue(siblings);

    const result = await useCase.execute({
      requesterId: 'user-1',
      taskId: 'task-1',
      columnId: 'col-source',
      order: 2,
    });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 'task-2', columnId: 'col-source', order: 0 },
      { id: 'task-3', columnId: 'col-source', order: 1 },
      { id: 'task-1', columnId: 'col-source', order: 2 },
    ]);
    expect(result.order).toBe(2);
    expect(activityLogRecorder.recordStatusChanged).not.toHaveBeenCalled();
  });

  it('reorders within the same column to the end when no explicit order is given', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    const siblings = [task, makeTask('task-2', 'col-source', 1)];

    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(sourceColumn);
    taskRepository.findByColumnId.mockResolvedValue(siblings);

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-source' });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 'task-2', columnId: 'col-source', order: 0 },
      { id: 'task-1', columnId: 'col-source', order: 1 },
    ]);
    expect(result.order).toBe(1);
  });

  it('moves the task into an empty column', async () => {
    const task = makeTask('task-1', 'col-source', 0);

    taskAccessService.resolve.mockResolvedValue({ task, column: sourceColumn, board });
    columnRepository.findById.mockResolvedValue(targetColumn);
    taskRepository.findByColumnId.mockImplementation((columnId: string) => {
      if (columnId === 'col-source') return Promise.resolve([task]);
      if (columnId === 'col-target') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-target' });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 'task-1', columnId: 'col-target', order: 0 },
    ]);
    expect(result.columnId).toBe('col-target');
    expect(result.order).toBe(0);
  });
});
