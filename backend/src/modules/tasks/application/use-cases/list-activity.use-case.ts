import { Inject, Injectable } from '@nestjs/common';
import { ActivityLog } from '../../../activity-logs/domain/activity-log.entity';
import {
  ActivityLogRepository,
  ACTIVITY_LOG_REPOSITORY,
} from '../../../activity-logs/application/ports/activity-log-repository.port';
import { TaskAccessService } from '../services/task-access.service';

export interface ListActivityInput {
  requesterId: string;
  taskId: string;
}

@Injectable()
export class ListActivityUseCase {
  constructor(
    private readonly taskAccessService: TaskAccessService,
    @Inject(ACTIVITY_LOG_REPOSITORY) private readonly activityLogRepository: ActivityLogRepository,
  ) {}

  async execute(input: ListActivityInput): Promise<ActivityLog[]> {
    await this.taskAccessService.resolve(input.taskId, input.requesterId);

    return this.activityLogRepository.findByTaskId(input.taskId);
  }
}
