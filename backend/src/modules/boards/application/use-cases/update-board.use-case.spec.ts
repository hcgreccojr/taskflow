import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateBoardUseCase } from './update-board.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';

describe('UpdateBoardUseCase', () => {
  let useCase: UpdateBoardUseCase;
  let boardRepository: { findById: jest.Mock; update: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  beforeEach(() => {
    boardRepository = { findById: jest.fn(), update: jest.fn() };
    membershipChecker = { assertMember: jest.fn() };
    useCase = new UpdateBoardUseCase(
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  const input = { requesterId: 'user-1', boardId: 'board-1', name: 'Sprint 2' };

  it('throws NotFoundException when the board does not exist', async () => {
    boardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipChecker.assertMember).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(boardRepository.update).not.toHaveBeenCalled();
  });

  it('updates the board when the requester is a member', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const updated = new Board('board-1', 'org-1', 'Sprint 2', null);
    boardRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute(input);

    expect(boardRepository.update).toHaveBeenCalledWith('board-1', {
      name: 'Sprint 2',
      description: undefined,
    });
    expect(result).toBe(updated);
  });
});
