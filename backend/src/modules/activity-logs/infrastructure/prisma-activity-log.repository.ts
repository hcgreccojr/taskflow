import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ActivityLog } from '../domain/activity-log.entity';
import {
  ActivityLogRepository,
  CreateActivityLogData,
} from '../application/ports/activity-log-repository.port';

interface ActivityLogRow {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  createdAt: Date;
}

@Injectable()
export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityLogData): Promise<ActivityLog> {
    const row = await this.prisma.activityLog.create({
      data: { taskId: data.taskId, userId: data.userId, action: data.action },
    });
    return this.toDomain(row);
  }

  async findByTaskId(taskId: string): Promise<ActivityLog[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: ActivityLogRow): ActivityLog {
    return new ActivityLog(row.id, row.taskId, row.userId, row.action, row.createdAt);
  }
}
