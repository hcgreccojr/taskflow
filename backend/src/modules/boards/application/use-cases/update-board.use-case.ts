import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';
import { BoardRepository, BOARD_REPOSITORY } from '../ports/board-repository.port';

export interface UpdateBoardInput {
  requesterId: string;
  boardId: string;
  name?: string;
  description?: string | null;
}

@Injectable()
export class UpdateBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: UpdateBoardInput): Promise<Board> {
    const board = await this.boardRepository.findById(input.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertMember(input.requesterId, board.organizationId);

    return this.boardRepository.update(input.boardId, {
      name: input.name,
      description: input.description,
    });
  }
}
