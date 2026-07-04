import { Inject, Injectable } from '@nestjs/common';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';
import { BoardRepository, BOARD_REPOSITORY } from '../ports/board-repository.port';

export interface ListBoardsInput {
  requesterId: string;
  organizationId: string;
}

@Injectable()
export class ListBoardsUseCase {
  constructor(
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
  ) {}

  async execute(input: ListBoardsInput): Promise<Board[]> {
    await this.membershipChecker.assertMember(input.requesterId, input.organizationId);
    return this.boardRepository.findByOrganizationId(input.organizationId);
  }
}
