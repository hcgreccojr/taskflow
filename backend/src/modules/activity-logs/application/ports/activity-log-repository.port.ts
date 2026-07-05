import { ActivityLog } from '../../domain/activity-log.entity';

export const ACTIVITY_LOG_REPOSITORY = Symbol('ACTIVITY_LOG_REPOSITORY');

export interface CreateActivityLogData {
  taskId: string;
  userId: string;
  action: string;
}

export interface ActivityLogRepository {
  create(data: CreateActivityLogData): Promise<ActivityLog>;
  /** Ordenadas por `createdAt` descendente (mais recente primeiro). */
  findByTaskId(taskId: string): Promise<ActivityLog[]>;
}
