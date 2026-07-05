import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MoveTaskUseCase } from './move-task.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('MoveTaskUseCase', () => {
  let useCase: MoveTaskUseCase;
  let taskRepository: { findById: jest.Mock; findByColumnId: jest.Mock; updatePositions: jest.Mock };
  let columnRepository: { findById: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };
  let activityLogRecorder: { recordStatusChanged: jest.Mock };

  const board = new Board('board-1', 'org-1', 'Sprint 1', null);
  const sourceColumn = new Column('col-source', 'board-1', 'A Fazer', 0);
  const targetColumn = new Column('col-target', 'board-1', 'Em Progresso', 1);
  const otherBoardColumn = new Column('col-other-board', 'board-2', 'Backlog', 0);

  const makeTask = (id: string, columnId: string, order: number) =>
    new Task(id, columnId, `Tarefa ${id}`, null, null, null, order, TaskPriority.MEDIUM, new Date());

  beforeEach(() => {
    taskRepository = { findById: jest.fn(), findByColumnId: jest.fn(), updatePositions: jest.fn() };
    columnRepository = { findById: jest.fn() };
    boardRepository = { findById: jest.fn().mockResolvedValue(board) };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    activityLogRecorder = { recordStatusChanged: jest.fn().mockResolvedValue(undefined) };
    useCase = new MoveTaskUseCase(
      taskRepository as any,
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
      activityLogRecorder as unknown as ActivityLogRecorderService,
    );
  });

  it('throws NotFoundException when the task does not exist', async () => {
    taskRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'missing', columnId: 'col-target' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects moving the task to a column of another board', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      if (id === 'col-other-board') return Promise.resolve(otherBoardColumn);
      return Promise.resolve(null);
    });

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-other-board' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      if (id === 'col-target') return Promise.resolve(targetColumn);
      return Promise.resolve(null);
    });
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', columnId: 'col-target' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('moves the task to the end of another column in the same board and compacts the source column', async () => {
    const task = makeTask('task-1', 'col-source', 1);
    const sourceSiblings = [makeTask('task-0', 'col-source', 0), task, makeTask('task-2', 'col-source', 2)];
    const targetSiblings = [makeTask('task-t0', 'col-target', 0)];

    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      if (id === 'col-target') return Promise.resolve(targetColumn);
      return Promise.resolve(null);
    });
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
  });

  it('moves the task to a specific position in the middle of another column', async () => {
    const task = makeTask('task-1', 'col-source', 0);
    const sourceSiblings = [task];
    const targetSiblings = [
      makeTask('task-t0', 'col-target', 0),
      makeTask('task-t1', 'col-target', 1),
    ];

    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      if (id === 'col-target') return Promise.resolve(targetColumn);
      return Promise.resolve(null);
    });
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

    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      return Promise.resolve(null);
    });
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

  it('moves the task into an empty column', async () => {
    const task = makeTask('task-1', 'col-source', 0);

    taskRepository.findById.mockResolvedValue(task);
    columnRepository.findById.mockImplementation((id: string) => {
      if (id === 'col-source') return Promise.resolve(sourceColumn);
      if (id === 'col-target') return Promise.resolve(targetColumn);
      return Promise.resolve(null);
    });
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
