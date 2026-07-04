import { ApiProperty } from '@nestjs/swagger';
import { Column } from '../../domain/column.entity';

export class ColumnResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  boardId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;

  static fromDomain(column: Column): ColumnResponseDto {
    const dto = new ColumnResponseDto();
    dto.id = column.id;
    dto.boardId = column.boardId;
    dto.name = column.name;
    dto.order = column.order;
    return dto;
  }
}
