import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateTaskUseCase } from './create-task.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Membership, MembershipRole } from '../../../organizations/domain/membership.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let columnRepository: { findById: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };
  let membershipRepository: { findByUserAndOrganization: jest.Mock };
  let taskRepository: { findByColumnId: jest.Mock; create: jest.Mock };
  let activityLogRecorder: { recordCreated: jest.Mock };

  beforeEach(() => {
    columnRepository = { findById: jest.fn() };
    boardRepository = { findById: jest.fn() };
    membershipChecker = { assertMember: jest.fn() };
    membershipRepository = { findByUserAndOrganization: jest.fn() };
    taskRepository = { findByColumnId: jest.fn(), create: jest.fn() };
    activityLogRecorder = { recordCreated: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreateTaskUseCase(
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
      membershipRepository as any,
      taskRepository as any,
      activityLogRecorder as unknown as ActivityLogRecorderService,
    );
  });

  it('throws NotFoundException when the column does not exist', async () => {
    columnRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'missing', title: 'Nova tarefa' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the board does not exist', async () => {
    columnRepository.findById.mockResolvedValue(new Column('col-1', 'board-missing', 'A Fazer', 0));
    boardRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-1', title: 'Nova tarefa' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    columnRepository.findById.mockResolvedValue(new Column('col-1', 'board-1', 'A Fazer', 0));
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-1', title: 'Nova tarefa' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws UnprocessableEntityException when the assignee is not a member of the organization', async () => {
    columnRepository.findById.mockResolvedValue(new Column('col-1', 'board-1', 'A Fazer', 0));
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockResolvedValue(undefined);
    membershipRepository.findByUserAndOrganization.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'user-1',
        columnId: 'col-1',
        title: 'Nova tarefa',
        assigneeId: 'outsider',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('creates the task with order equal to the current task count', async () => {
    columnRepository.findById.mockResolvedValue(new Column('col-1', 'board-1', 'A Fazer', 0));
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockResolvedValue(undefined);
    membershipRepository.findByUserAndOrganization.mockResolvedValue(
      new Membership('mem-1', 'assignee-1', 'org-1', MembershipRole.MEMBER),
    );
    taskRepository.findByColumnId.mockResolvedValue([
      new Task('task-1', 'col-1', 'Existente', null, null, null, 0, TaskPriority.MEDIUM, new Date()),
    ]);
    const created = new Task(
      'task-2',
      'col-1',
      'Nova tarefa',
      null,
      'assignee-1',
      null,
      1,
      TaskPriority.HIGH,
      new Date(),
    );
    taskRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({
      requesterId: 'user-1',
      columnId: 'col-1',
      title: 'Nova tarefa',
      assigneeId: 'assignee-1',
      priority: TaskPriority.HIGH,
    });

    expect(taskRepository.create).toHaveBeenCalledWith({
      columnId: 'col-1',
      title: 'Nova tarefa',
      description: undefined,
      assigneeId: 'assignee-1',
      dueDate: undefined,
      priority: TaskPriority.HIGH,
      order: 1,
    });
    expect(activityLogRecorder.recordCreated).toHaveBeenCalledWith('task-2', 'user-1');
    expect(result).toBe(created);
  });
});
