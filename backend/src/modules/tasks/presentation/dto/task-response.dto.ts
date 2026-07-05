import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task, TaskPriority } from '../../domain/task.entity';

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  columnId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  assigneeId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dueDate!: Date | null;

  @ApiProperty()
  order!: number;

  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.columnId = task.columnId;
    dto.title = task.title;
    dto.description = task.description;
    dto.assigneeId = task.assigneeId;
    dto.dueDate = task.dueDate;
    dto.order = task.order;
    dto.priority = task.priority;
    dto.createdAt = task.createdAt;
    return dto;
  }
}
