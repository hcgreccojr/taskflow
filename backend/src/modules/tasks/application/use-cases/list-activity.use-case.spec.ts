import { NotFoundException } from '@nestjs/common';
import { ListActivityUseCase } from './list-activity.use-case';
import { TaskAccessService } from '../services/task-access.service';
import { ActivityLog } from '../../../activity-logs/domain/activity-log.entity';

describe('ListActivityUseCase', () => {
  let useCase: ListActivityUseCase;
  let taskAccessService: { resolve: jest.Mock };
  let activityLogRepository: { findByTaskId: jest.Mock };

  beforeEach(() => {
    taskAccessService = { resolve: jest.fn().mockResolvedValue({}) };
    activityLogRepository = { findByTaskId: jest.fn() };
    useCase = new ListActivityUseCase(
      taskAccessService as unknown as TaskAccessService,
      activityLogRepository as any,
    );
  });

  it('propagates errors from task access resolution', async () => {
    taskAccessService.resolve.mockRejectedValue(new NotFoundException());

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the activity log entries for the task after authorizing', async () => {
    const entries = [new ActivityLog('log-1', 'task-1', 'user-1', 'Tarefa criada', new Date())];
    activityLogRepository.findByTaskId.mockResolvedValue(entries);

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1' });

    expect(taskAccessService.resolve).toHaveBeenCalledWith('task-1', 'user-1');
    expect(activityLogRepository.findByTaskId).toHaveBeenCalledWith('task-1');
    expect(result).toBe(entries);
  });
});
