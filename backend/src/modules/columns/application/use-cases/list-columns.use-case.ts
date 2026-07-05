import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Column } from '../../domain/column.entity';
import { ColumnRepository, COLUMN_REPOSITORY } from '../ports/column-repository.port';

export interface ListColumnsInput {
  requesterId: string;
  boardId: string;
}

@Injectable()
export class ListColumnsUseCase {
  constructor(
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: ListColumnsInput): Promise<Column[]> {
    const board = await this.boardRepository.findById(input.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

    return this.columnRepository.findByBoardId(input.boardId);
  }
}
