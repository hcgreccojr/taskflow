import { ForbiddenException } from '@nestjs/common';
import { CreateBoardUseCase } from './create-board.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';

describe('CreateBoardUseCase', () => {
  let useCase: CreateBoardUseCase;
  let membershipChecker: { assertMember: jest.Mock };
  let boardRepository: { create: jest.Mock };

  beforeEach(() => {
    membershipChecker = { assertMember: jest.fn() };
    boardRepository = { create: jest.fn() };
    useCase = new CreateBoardUseCase(
      membershipChecker as unknown as MembershipCheckerService,
      boardRepository as any,
    );
  });

  it('propagates ForbiddenException when the requester is not a member of the organization', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', organizationId: 'org-1', name: 'Sprint 1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(boardRepository.create).not.toHaveBeenCalled();
  });

  it('creates the board when the requester is a member', async () => {
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const created = new Board('board-1', 'org-1', 'Sprint 1', null);
    boardRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({
      requesterId: 'user-1',
      organizationId: 'org-1',
      name: 'Sprint 1',
    });

    expect(boardRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      name: 'Sprint 1',
      description: undefined,
    });
    expect(result).toBe(created);
  });
});
