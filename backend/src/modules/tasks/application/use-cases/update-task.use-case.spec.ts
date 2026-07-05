import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UpdateTaskUseCase } from './update-task.use-case';
import { TaskAccessService } from '../services/task-access.service';
import { ActivityLogRecorderService } from '../../../activity-logs/application/services/activity-log-recorder.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../../columns/domain/column.entity';
import { Membership, MembershipRole } from '../../../organizations/domain/membership.entity';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('UpdateTaskUseCase', () => {
  let useCase: UpdateTaskUseCase;
  let taskRepository: { findById: jest.Mock; update: jest.Mock };
  let membershipRepository: { findByUserAndOrganization: jest.Mock };
  let activityLogRecorder: { recordFieldsUpdated: jest.Mock; recordAssigned: jest.Mock };
  let taskAccessService: { resolve: jest.Mock };
  let realtimeNotifier: { notifyBoardEvent: jest.Mock };

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
  const column = new Column('col-1', 'board-1', 'A Fazer', 0);
  const board = new Board('board-1', 'org-1', 'Sprint 1', null);

  beforeEach(() => {
    taskRepository = { findById: jest.fn().mockResolvedValue(existingTask), update: jest.fn() };
    membershipRepository = { findByUserAndOrganization: jest.fn() };
    activityLogRecorder = {
      recordFieldsUpdated: jest.fn().mockResolvedValue(undefined),
      recordAssigned: jest.fn().mockResolvedValue(undefined),
    };
    taskAccessService = {
      resolve: jest.fn().mockResolvedValue({ task: existingTask, column, board }),
    };
    realtimeNotifier = { notifyBoardEvent: jest.fn() };
    useCase = new UpdateTaskUseCase(
      taskRepository as any,
      membershipRepository as any,
      activityLogRecorder as unknown as ActivityLogRecorderService,
      taskAccessService as unknown as TaskAccessService,
      realtimeNotifier as any,
    );
  });

  it('propagates NotFoundException from TaskAccessService when the task does not exist', async () => {
    taskAccessService.resolve.mockRejectedValue(new NotFoundException('Tarefa não encontrada'));

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'missing', title: 'Novo título' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    taskAccessService.resolve.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', title: 'Novo título' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
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
    expect(realtimeNotifier.notifyBoardEvent).toHaveBeenCalledWith('board-1', {
      type: 'task.updated',
      payload: updated,
    });
    expect(result).toBe(updated);
  });

  it('does not record activity when no field actually changes', async () => {
    taskRepository.update.mockResolvedValue(existingTask);

    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', title: existingTask.title });

    expect(activityLogRecorder.recordFieldsUpdated).not.toHaveBeenCalled();
    expect(activityLogRecorder.recordAssigned).not.toHaveBeenCalled();
  });

  it('detects a description change', async () => {
    taskRepository.update.mockResolvedValue(existingTask);

    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', description: 'Nova descrição' });

    expect(activityLogRecorder.recordFieldsUpdated).toHaveBeenCalledWith('task-1', 'user-1', [
      'descrição',
    ]);
  });

  it('detects a due date change', async () => {
    taskRepository.update.mockResolvedValue(existingTask);

    await useCase.execute({
      requesterId: 'user-1',
      taskId: 'task-1',
      dueDate: new Date('2026-08-01'),
    });

    expect(activityLogRecorder.recordFieldsUpdated).toHaveBeenCalledWith('task-1', 'user-1', ['prazo']);
  });

  it('detects clearing a due date that was previously set', async () => {
    const taskWithDueDate = new Task(
      'task-1',
      'col-1',
      'Título original',
      null,
      null,
      new Date('2026-08-01'),
      0,
      TaskPriority.MEDIUM,
      new Date(),
    );
    taskAccessService.resolve.mockResolvedValue({ task: taskWithDueDate, column, board });
    taskRepository.update.mockResolvedValue(taskWithDueDate);

    await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', dueDate: null });

    expect(activityLogRecorder.recordFieldsUpdated).toHaveBeenCalledWith('task-1', 'user-1', ['prazo']);
  });
});
