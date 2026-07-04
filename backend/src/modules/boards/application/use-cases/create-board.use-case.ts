import { Inject, Injectable } from '@nestjs/common';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';
import { BoardRepository, BOARD_REPOSITORY } from '../ports/board-repository.port';

export interface CreateBoardInput {
  requesterId: string;
  organizationId: string;
  name: string;
  description?: string;
}

@Injectable()
export class CreateBoardUseCase {
  constructor(
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
  ) {}

  async execute(input: CreateBoardInput): Promise<Board> {
    await this.membershipChecker.assertMember(input.requesterId, input.organizationId);

    return this.boardRepository.create({
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
    });
  }
}
