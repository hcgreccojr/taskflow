import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListColumnsUseCase } from './list-columns.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../domain/column.entity';

describe('ListColumnsUseCase', () => {
  let useCase: ListColumnsUseCase;
  let columnRepository: { findByBoardId: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  const columns = [
    new Column('col-1', 'board-1', 'A Fazer', 0),
    new Column('col-2', 'board-1', 'Em Progresso', 1),
  ];

  beforeEach(() => {
    columnRepository = { findByBoardId: jest.fn().mockResolvedValue(columns) };
    boardRepository = {
      findById: jest.fn().mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null)),
    };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    useCase = new ListColumnsUseCase(
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  it('throws NotFoundException when the board does not exist', async () => {
    boardRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', boardId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipChecker.assertMember).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', boardId: 'board-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the columns of the board', async () => {
    const result = await useCase.execute({ requesterId: 'user-1', boardId: 'board-1' });

    expect(membershipChecker.assertMember).toHaveBeenCalledWith('user-1', 'org-1');
    expect(result).toBe(columns);
  });
});
