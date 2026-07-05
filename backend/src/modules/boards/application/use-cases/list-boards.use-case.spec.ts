import { ForbiddenException } from '@nestjs/common';
import { ListBoardsUseCase } from './list-boards.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';

describe('ListBoardsUseCase', () => {
  let useCase: ListBoardsUseCase;
  let membershipChecker: { assertMember: jest.Mock };
  let boardRepository: { findByOrganizationId: jest.Mock };

  beforeEach(() => {
    membershipChecker = { assertMember: jest.fn() };
    boardRepository = { findByOrganizationId: jest.fn() };
    useCase = new ListBoardsUseCase(
      membershipChecker as unknown as MembershipCheckerService,
      boardRepository as any,
    );
  });

  it('propagates ForbiddenException when the requester is not a member of the organization', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', organizationId: 'org-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(boardRepository.findByOrganizationId).not.toHaveBeenCalled();
  });

  it('returns the boards of the organization when the requester is a member', async () => {
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const boards = [new Board('board-1', 'org-1', 'Sprint 1', null)];
    boardRepository.findByOrganizationId.mockResolvedValue(boards);

    const result = await useCase.execute({ requesterId: 'user-1', organizationId: 'org-1' });

    expect(membershipChecker.assertMember).toHaveBeenCalledWith('user-1', 'org-1');
    expect(boardRepository.findByOrganizationId).toHaveBeenCalledWith('org-1');
    expect(result).toBe(boards);
  });
});
