import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { BoardRepository, BOARD_REPOSITORY } from '../ports/board-repository.port';

export interface DeleteBoardInput {
  requesterId: string;
  boardId: string;
}

/** Exclusão de quadro é destrutiva (apaga colunas e tarefas em cascata) — exige ADMIN. */
@Injectable()
export class DeleteBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: DeleteBoardInput): Promise<void> {
    const board = await this.boardRepository.findById(input.boardId);
    if (!board) {
      throw new NotFoundException('Quadro não encontrado');
    }

    await this.membershipChecker.assertAdmin(input.requesterId, board.organizationId);

    await this.boardRepository.delete(input.boardId);
  }
}
