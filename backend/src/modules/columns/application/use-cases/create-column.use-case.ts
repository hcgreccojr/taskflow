import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRepository, BOARD_REPOSITORY } from '../../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { RealtimeNotifier, REALTIME_NOTIFIER } from '../../../realtime/application/ports/realtime-notifier.port';
import { Column } from '../../domain/column.entity';
import { ColumnRepository, COLUMN_REPOSITORY } from '../ports/column-repository.port';

export interface CreateColumnInput {
  requesterId: string;
  boardId: string;
  name: string;
}

@Injectable()
export class CreateColumnUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(COLUMN_REPOSITORY) private readonly columnRepository: ColumnRepository,
    @Inject(REALTIME_NOTIFIER) private readonly realtimeNotifier: RealtimeNotifier,
  ) {}

  async execute(input: CreateColumnInput): Promise<Column> {
    const board = await this.boardRepository.findById(input.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

    const existingColumns = await this.columnRepository.findByBoardId(input.boardId);

    const created = await this.columnRepository.create({
      boardId: input.boardId,
      name: input.name,
      order: existingColumns.length,
    });

    this.realtimeNotifier.notifyBoardEvent(board.id, { type: 'column.created', payload: created });

    return created;
  }
}
