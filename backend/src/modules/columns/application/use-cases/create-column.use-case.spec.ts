import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateColumnUseCase } from './create-column.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../domain/column.entity';

describe('CreateColumnUseCase', () => {
  let useCase: CreateColumnUseCase;
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };
  let columnRepository: { findByBoardId: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    boardRepository = { findById: jest.fn() };
    membershipChecker = { assertMember: jest.fn() };
    columnRepository = { findByBoardId: jest.fn(), create: jest.fn() };
    useCase = new CreateColumnUseCase(
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
      columnRepository as any,
    );
  });

  it('throws NotFoundException when the board does not exist', async () => {
    boardRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', boardId: 'board-1', name: 'A Fazer' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member of the board organization', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', boardId: 'board-1', name: 'A Fazer' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates the column with order equal to the current column count', async () => {
    boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
    membershipChecker.assertMember.mockResolvedValue(undefined);
    columnRepository.findByBoardId.mockResolvedValue([
      new Column('col-1', 'board-1', 'A Fazer', 0),
      new Column('col-2', 'board-1', 'Em Progresso', 1),
    ]);
    const created = new Column('col-3', 'board-1', 'Concluído', 2);
    columnRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({
      requesterId: 'user-1',
      boardId: 'board-1',
      name: 'Concluído',
    });

    expect(columnRepository.create).toHaveBeenCalledWith({
      boardId: 'board-1',
      name: 'Concluído',
      order: 2,
    });
    expect(result).toBe(created);
  });
});
