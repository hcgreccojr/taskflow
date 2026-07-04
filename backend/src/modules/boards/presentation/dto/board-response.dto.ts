import { ApiProperty } from '@nestjs/swagger';
import { Board } from '../../domain/board.entity';

export class BoardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  static fromDomain(board: Board): BoardResponseDto {
    const dto = new BoardResponseDto();
    dto.id = board.id;
    dto.organizationId = board.organizationId;
    dto.name = board.name;
    dto.description = board.description;
    return dto;
  }
}
