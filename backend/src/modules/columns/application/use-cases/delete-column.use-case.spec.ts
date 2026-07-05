import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteColumnUseCase } from './delete-column.use-case';
import { MembershipCheckerService } from '../../../organizations/application/services/membership-checker.service';
import { Board } from '../../../boards/domain/board.entity';
import { Column } from '../../domain/column.entity';
import { Task, TaskPriority } from '../../../tasks/domain/task.entity';

describe('DeleteColumnUseCase', () => {
  let useCase: DeleteColumnUseCase;
  let columnRepository: {
    findById: jest.Mock;
    findByBoardId: jest.Mock;
    updateOrders: jest.Mock;
    delete: jest.Mock;
  };
  let boardRepository: { findById: jest.Mock };
  let taskRepository: { findByColumnId: jest.Mock; updatePositions: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  const board = new Board('board-1', 'org-1', 'Sprint 1', null);
  const colA = new Column('col-a', 'board-1', 'A Fazer', 0);
  const colB = new Column('col-b', 'board-1', 'Em Progresso', 1);
  const colC = new Column('col-c', 'board-1', 'Concluído', 2);

  const makeTask = (id: string, columnId: string, order: number) =>
    new Task(id, columnId, `Tarefa ${id}`, null, null, null, order, TaskPriority.MEDIUM, new Date());

  beforeEach(() => {
    columnRepository = {
      findById: jest.fn(),
      findByBoardId: jest.fn(),
      updateOrders: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    boardRepository = { findById: jest.fn().mockResolvedValue(board) };
    taskRepository = { findByColumnId: jest.fn(), updatePositions: jest.fn().mockResolvedValue(undefined) };
    membershipChecker = { assertMember: jest.fn().mockResolvedValue(undefined) };
    useCase = new DeleteColumnUseCase(
      columnRepository as any,
      boardRepository as any,
      taskRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  it('throws NotFoundException when the column does not exist', async () => {
    columnRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the board does not exist', async () => {
    columnRepository.findById.mockResolvedValue(colA);
    boardRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-a' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    columnRepository.findById.mockResolvedValue(colA);
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-a' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks deletion when it is the only column of the board', async () => {
    columnRepository.findById.mockResolvedValue(colA);
    columnRepository.findByBoardId.mockResolvedValue([colA]);

    await expect(
      useCase.execute({ requesterId: 'user-1', columnId: 'col-a' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(columnRepository.delete).not.toHaveBeenCalled();
  });

  it('moves tasks to the first remaining column, deletes the column and reindexes the others', async () => {
    columnRepository.findById.mockResolvedValue(colB);
    columnRepository.findByBoardId.mockResolvedValue([colA, colB, colC]);
    taskRepository.findByColumnId.mockImplementation((columnId: string) => {
      if (columnId === 'col-b') return Promise.resolve([makeTask('t1', 'col-b', 0)]);
      if (columnId === 'col-a') return Promise.resolve([makeTask('t0', 'col-a', 0)]);
      return Promise.resolve([]);
    });

    await useCase.execute({ requesterId: 'user-1', columnId: 'col-b' });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 't0', columnId: 'col-a', order: 0 },
      { id: 't1', columnId: 'col-a', order: 1 },
    ]);
    expect(columnRepository.delete).toHaveBeenCalledWith('col-b');
    expect(columnRepository.updateOrders).toHaveBeenCalledWith([
      { id: 'col-a', order: 0 },
      { id: 'col-c', order: 1 },
    ]);
  });

  it('moves tasks to the new first column when the first column itself is deleted', async () => {
    columnRepository.findById.mockResolvedValue(colA);
    columnRepository.findByBoardId.mockResolvedValue([colA, colB, colC]);
    taskRepository.findByColumnId.mockImplementation((columnId: string) => {
      if (columnId === 'col-a') return Promise.resolve([makeTask('t0', 'col-a', 0)]);
      return Promise.resolve([]);
    });

    await useCase.execute({ requesterId: 'user-1', columnId: 'col-a' });

    expect(taskRepository.updatePositions).toHaveBeenCalledWith([
      { id: 't0', columnId: 'col-b', order: 0 },
    ]);
    expect(columnRepository.updateOrders).toHaveBeenCalledWith([
      { id: 'col-b', order: 0 },
      { id: 'col-c', order: 1 },
    ]);
  });

  it('skips moving tasks when the column being deleted is empty', async () => {
    columnRepository.findById.mockResolvedValue(colB);
    columnRepository.findByBoardId.mockResolvedValue([colA, colB]);
    taskRepository.findByColumnId.mockResolvedValue([]);

    await useCase.execute({ requesterId: 'user-1', columnId: 'col-b' });

    expect(taskRepository.updatePositions).not.toHaveBeenCalled();
    expect(columnRepository.delete).toHaveBeenCalledWith('col-b');
  });
});
