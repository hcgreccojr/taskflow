import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskAccessService } from './task-access.service';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('TaskAccessService', () => {
  let service: TaskAccessService;
  let taskRepository: { findById: jest.Mock };
  let columnRepository: { findById: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  const task = new Task('task-1', 'col-1', 'Tarefa', null, null, null, 0, TaskPriority.MEDIUM, new Date());
  const column = new Column('col-1', 'board-1', 'A Fazer', 0);
  const board = new Board('board-1', 'org-1', 'Sprint 1', null);

  beforeEach(() => {
    taskRepository = { findById: jest.fn().mockResolvedValue(task) };
    columnRepository = { findById: jest.fn().mockResolvedValue(column) };
    boardRepository = { findById: jest.fn().mockResolvedValue(board) };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    service = new TaskAccessService(
      taskRepository as any,
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  it('throws NotFoundException when the task does not exist', async () => {
    taskRepository.findById.mockResolvedValue(null);

    await expect(service.resolve('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the column does not exist', async () => {
    columnRepository.findById.mockResolvedValue(null);

    await expect(service.resolve('task-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the board does not exist', async () => {
    boardRepository.findById.mockResolvedValue(null);

    await expect(service.resolve('task-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(service.resolve('task-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolves task, column and board when the requester is a member', async () => {
    const result = await service.resolve('task-1', 'user-1');

    expect(result).toEqual({ task, column, board });
    expect(membershipChecker.assertMember).toHaveBeenCalledWith('user-1', 'org-1');
  });
});
