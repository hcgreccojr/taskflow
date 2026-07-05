import { Module } from '@nestjs/common';
import { ACTIVITY_LOG_REPOSITORY } from './application/ports/activity-log-repository.port';
import { PrismaActivityLogRepository } from './infrastructure/prisma-activity-log.repository';
import { ActivityLogRecorderService } from './application/services/activity-log-recorder.service';

@Module({
  providers: [
    { provide: ACTIVITY_LOG_REPOSITORY, useClass: PrismaActivityLogRepository },
    ActivityLogRecorderService,
  ],
  exports: [ActivityLogRecorderService, ACTIVITY_LOG_REPOSITORY],
})
export class ActivityLogsModule {}
