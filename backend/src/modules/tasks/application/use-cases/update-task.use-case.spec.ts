import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UpdateTaskUseCase } from './update-task.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Membership, MembershipRole } from '../../../organizations/domain/membership.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('UpdateTaskUseCase', () => {
  let useCase: UpdateTaskUseCase;
  let taskRepository: { findById: jest.Mock; update: jest.Mock };
  let columnRepository: { findById: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };
  let membershipRepository: { findByUserAndOrganization: jest.Mock };
  let activityLogRecorder: { recordFieldsUpdated: jest.Mock; recordAssigned: jest.Mock };

  const existingTask = new Task(
    'task-1',
    'col-1',
    'Título original',
    null,
    null,
    null,
    0,
    TaskPriority.MEDIUM,
    new Date(),
  );

  beforeEach(() => {
    taskRepository = { findById: jest.fn().mockResolvedValue(existingTask), update: jest.fn() };
    columnRepository = {
      findById: jest.fn().mockResolvedValue(new Column('col-1', 'board-1', 'A Fazer', 0)),
    };
    boardRepository = {
      findById: jest.fn().mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null)),
    };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    membershipRepository = { findByUserAndOrganization: jest.fn() };
    activityLogRecorder = {
      recordFieldsUpdated: jest.fn().mockResolvedValue(undefined),
      recordAssigned: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpdateTaskUseCase(
      taskRepository as any,
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
      membershipRepository as any,
      activityLogRecorder as unknown as ActivityLogRecorderService,
    );
  });

  it('throws NotFoundException when the task does not exist', async () => {
    taskRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'missing', title: 'Novo título' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws UnprocessableEntityException when the new assignee is not a member', async () => {
    membershipRepository.findByUserAndOrganization.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', assigneeId: 'outsider' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates only the informed fields', async () => {
    membershipRepository.findByUserAndOrganization.mockResolvedValue(
      new Membership('mem-1', 'assignee-1', 'org-1', MembershipRole.MEMBER),
    );
    const updated = new Task(
      'task-1',
      'col-1',
      'Novo título',
      null,
      'assignee-1',
      null,
      0,
      TaskPriority.HIGH,
      new Date(),
    );
    taskRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      requesterId: 'user-1',
      taskId: 'task-1',
      title: 'Novo título',
      assigneeId: 'assignee-1',
      priority: TaskPriority.HIGH,
    });

    expect(taskRepository.update).toHaveBeenCalledWith('task-1', {
      title: 'Novo título',
      description: undefined,
      assigneeId: 'assignee-1',
      dueDate: undefined,
      priority: TaskPriority.HIGH,
    });
    expect(activityLogRecorder.recordFieldsUpdated).toHaveBeenCalledWith('task-1', 'user-1', [
      'título',
      'prioridade',
    ]);
    expect(activityLogRecorder.recordAssigned).toHaveBeenCalledWith('task-1', 'user-1');
    expect(result).toBe(updated);
  });

  it('does not record activity when no field actually changes', async () => {
    taskRepository.update.mockResolvedValue(existingTask);

    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', title: existingTask.title });

    expect(activityLogRecorder.recordFieldsUpdated).not.toHaveBeenCalled();
    expect(activityLogRecorder.recordAssigned).not.toHaveBeenCalled();
  });
});
