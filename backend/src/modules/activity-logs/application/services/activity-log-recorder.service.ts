import { Inject, Injectable } from '@nestjs/common';
import { ActivityLog } from '../../domain/activity-log.entity';
import {
  ActivityLogRepository,
  ACTIVITY_LOG_REPOSITORY,
} from '../ports/activity-log-repository.port';

@Injectable()
export class ActivityLogRecorderService {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY) private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  recordCreated(taskId: string, userId: string): Promise<ActivityLog> {
    return this.activityLogRepository.create({ taskId, userId, action: 'Tarefa criada' });
  }

  recordFieldsUpdated(taskId: string, userId: string, fields: string[]): Promise<ActivityLog> {
    return this.activityLogRepository.create({
      taskId,
      userId,
      action: `Campos atualizados: ${fields.join(', ')}`,
    });
  }

  recordAssigned(taskId: string, userId: string): Promise<ActivityLog> {
    return this.activityLogRepository.create({ taskId, userId, action: 'Responsável alterado' });
  }

  recordStatusChanged(taskId: string, userId: string): Promise<ActivityLog> {
    return this.activityLogRepository.create({
      taskId,
      userId,
      action: 'Tarefa movida para outra coluna',
    });
  }
}
