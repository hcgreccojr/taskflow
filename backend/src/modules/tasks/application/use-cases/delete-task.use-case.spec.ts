import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteTaskUseCase } from './delete-task.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('DeleteTaskUseCase', () => {
  let useCase: DeleteTaskUseCase;
  let taskRepository: { findById: jest.Mock; delete: jest.Mock };
  let columnRepository: { findById: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

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

  beforeEach(() => {
    taskRepository = { findById: jest.fn().mockResolvedValue(existingTask), delete: jest.fn() };
    columnRepository = {
      findById: jest.fn().mockResolvedValue(new Column('col-1', 'board-1', 'A Fazer', 0)),
    };
    boardRepository = {
      findById: jest.fn().mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null)),
    };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    useCase = new DeleteTaskUseCase(
      taskRepository as any,
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  it('throws NotFoundException when the task does not exist', async () => {
    taskRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'task-1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes the task when the requester is a member', async () => {
    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1' });

    expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
  });
});
