import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Column } from '../../domain/column.entity';
import { ColumnRepository, COLUMN_REPOSITORY } from '../ports/column-repository.port';

export interface ReorderColumnInput {
  requesterId: string;
  columnId: string;
  order: number;
}

@Injectable()
export class ReorderColumnUseCase {
  constructor(
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: ReorderColumnInput): Promise<Column[]> {
    const column = await this.columnRepository.findById(input.columnId);
    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    const board = await this.boardRepository.findById(column.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

    const siblings = await this.columnRepository.findByBoardId(column.boardId);
    const withoutMoved = siblings.filter((sibling) => sibling.id !== column.id);

    const targetIndex = Math.min(Math.max(input.order, 0), withoutMoved.length);
    withoutMoved.splice(targetIndex, 0, column);

    const updates = withoutMoved.map((sibling, index) => ({ id: sibling.id, order: index }));
    await this.columnRepository.updateOrders(updates);

    return withoutMoved.map((sibling, index) => new Column(sibling.id, sibling.boardId, sibling.name, index));
  }
}
