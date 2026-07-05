import { ApiProperty } from '@nestjs/swagger';
import { ActivityLog } from '../../../activity-logs/domain/activity-log.entity';

export class ActivityLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(entry: ActivityLog): ActivityLogResponseDto {
    const dto = new ActivityLogResponseDto();
    dto.id = entry.id;
    dto.taskId = entry.taskId;
    dto.userId = entry.userId;
    dto.action = entry.action;
    dto.createdAt = entry.createdAt;
    return dto;
  }
}
