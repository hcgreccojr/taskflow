import { NotFoundException } from '@nestjs/common';
import { ReorderColumnUseCase } from './reorder-column.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../domain/column.entity';

describe('ReorderColumnUseCase', () => {
  let useCase: ReorderColumnUseCase;
  let columnRepository: { findById: jest.Mock; findByBoardId: jest.Mock; updateOrders: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };
  let realtimeNotifier: { notifyBoardEvent: jest.Mock };

  const columns = [
    new Column('col-1', 'board-1', 'A Fazer', 0),
    new Column('col-2', 'board-1', 'Em Progresso', 1),
    new Column('col-3', 'board-1', 'Concluído', 2),
  ];

  beforeEach(() => {
    columnRepository = {
      findById: jest.fn(),
      findByBoardId: jest.fn().mockResolvedValue(columns),
      updateOrders: jest.fn().mockResolvedValue(undefined),
    };
    boardRepository = { findById: jest.fn().mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null)) };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    realtimeNotifier = { notifyBoardEvent: jest.fn() };
    useCase = new ReorderColumnUseCase(
      columnRepository as any,
      boardRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
      realtimeNotifier as any,
    );
  });

  it('throws NotFoundException when the board does not exist', async () => {
    columnRepository.findById.mockResolvedValue(columns[0]);
    boardRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-1', order: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the column does not exist', async () => {
    columnRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'missing', order: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('moves the last column to the start and shifts the others down', async () => {
    columnRepository.findById.mockResolvedValue(columns[2]); // col-3, currently order 2

    const result = await useCase.execute({ requesterId: 'user-1', columnId: 'col-3', order: 0 });

    expect(columnRepository.updateOrders).toHaveBeenCalledWith([
      { id: 'col-3', order: 0 },
      { id: 'col-1', order: 1 },
      { id: 'col-2', order: 2 },
    ]);
    expect(result.map((c) => c.id)).toEqual(['col-3', 'col-1', 'col-2']);
    expect(realtimeNotifier.notifyBoardEvent).toHaveBeenCalledWith('board-1', {
      type: 'column.reordered',
      payload: result,
    });
  });

  it('moves the first column to the middle', async () => {
    columnRepository.findById.mockResolvedValue(columns[0]); // col-1, currently order 0

    await useCase.execute({ requesterId: 'user-1', columnId: 'col-1', order: 1 });

    expect(columnRepository.updateOrders).toHaveBeenCalledWith([
      { id: 'col-2', order: 0 },
      { id: 'col-1', order: 1 },
      { id: 'col-3', order: 2 },
    ]);
  });

  it('clamps an order beyond the end of the list to the last position', async () => {
    columnRepository.findById.mockResolvedValue(columns[0]); // col-1

    await useCase.execute({ requesterId: 'user-1', columnId: 'col-1', order: 99 });

    expect(columnRepository.updateOrders).toHaveBeenCalledWith([
      { id: 'col-2', order: 0 },
      { id: 'col-3', order: 1 },
      { id: 'col-1', order: 2 },
    ]);
  });
});
