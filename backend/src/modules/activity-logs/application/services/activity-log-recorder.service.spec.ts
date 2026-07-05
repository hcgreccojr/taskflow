import { ActivityLogRecorderService } from './activity-log-recorder.service';
import { ActivityLogRepository } from '../ports/activity-log-repository.port';
import { ActivityLog } from '../../domain/activity-log.entity';

describe('ActivityLogRecorderService', () => {
  let service: ActivityLogRecorderService;
  let activityLogRepository: { create: jest.Mock; findByTaskId: jest.Mock };

  beforeEach(() => {
    activityLogRepository = { create: jest.fn(), findByTaskId: jest.fn() };
    service = new ActivityLogRecorderService(activityLogRepository as unknown as ActivityLogRepository);
  });

  it('recordCreated logs "Tarefa criada"', async () => {
    const created = new ActivityLog('log-1', 'task-1', 'user-1', 'Tarefa criada', new Date());
    activityLogRepository.create.mockResolvedValue(created);

    const result = await service.recordCreated('task-1', 'user-1');

    expect(activityLogRepository.create).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      action: 'Tarefa criada',
    });
    expect(result).toBe(created);
  });

  it('recordFieldsUpdated joins the changed field names into a single action string', async () => {
    activityLogRepository.create.mockResolvedValue(
      new ActivityLog('log-2', 'task-1', 'user-1', 'Campos atualizados: título, prioridade', new Date()),
    );

    await service.recordFieldsUpdated('task-1', 'user-1', ['título', 'prioridade']);

    expect(activityLogRepository.create).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      action: 'Campos atualizados: título, prioridade',
    });
  });

  it('recordAssigned logs "Responsável alterado"', async () => {
    activityLogRepository.create.mockResolvedValue(
      new ActivityLog('log-3', 'task-1', 'user-1', 'Responsável alterado', new Date()),
    );

    await service.recordAssigned('task-1', 'user-1');

    expect(activityLogRepository.create).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      action: 'Responsável alterado',
    });
  });

  it('recordStatusChanged logs "Tarefa movida para outra coluna"', async () => {
    activityLogRepository.create.mockResolvedValue(
      new ActivityLog('log-4', 'task-1', 'user-1', 'Tarefa movida para outra coluna', new Date()),
    );

    await service.recordStatusChanged('task-1', 'user-1');

    expect(activityLogRepository.create).toHaveBeenCalledWith({
      taskId: 'task-1',
      userId: 'user-1',
      action: 'Tarefa movida para outra coluna',
    });
  });
});
