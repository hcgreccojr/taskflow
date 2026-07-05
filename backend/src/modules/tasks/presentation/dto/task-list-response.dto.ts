import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from './task-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class TaskListResponseDto {
  @ApiProperty({ type: TaskResponseDto, isArray: true })
  data!: TaskResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
