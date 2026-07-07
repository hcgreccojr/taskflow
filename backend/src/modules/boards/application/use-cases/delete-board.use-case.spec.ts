import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteBoardUseCase } from './delete-board.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../domain/board.entity';

describe('DeleteBoardUseCase', () => {
  let useCase: DeleteBoardUseCase;
  let boardRepository: { findById: jest.Mock; delete: jest.Mock };
  let membershipChecker: { assertAdmin: jest.Mock };

  beforeEach(() => {
    boardRepository = { findById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    membershipChecker = { assertAdmin: jest.fn() };
    useCase = new DeleteBoardUseCase(
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  const input = { requesterId: 'user-1', boardId: 'board-1' };

  it('throws NotFoundException when the board does not exist', async () => {
    boardRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipChecker.assertAdmin).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not an admin', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertAdmin.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(boardRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the board when the requester is an admin', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertAdmin.mockResolvedValue(undefined);

    await useCase.execute(input);

    expect(boardRepository.delete).toHaveBeenCalledWith('board-1');
  });
});
