import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../application/use-cases/list-tasks.use-case';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
