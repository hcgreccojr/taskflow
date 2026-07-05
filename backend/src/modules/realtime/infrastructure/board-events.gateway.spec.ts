import { ForbiddenException } from '@nestjs/common';
import { BoardEventsGateway } from './board-events.gateway';
import { TokenService } from '../../auth/application/ports/token.service.port';
import { BoardRepository } from '../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../organizations/application/services/membership-checker.service';
import { Board } from '../../boards/domain/board.entity';

describe('BoardEventsGateway', () => {
  let gateway: BoardEventsGateway;
  let tokenService: { verifyAccessToken: jest.Mock };
  let boardRepository: { findById: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  function makeClient(auth: Record<string, unknown> = {}) {
    return {
      handshake: { auth },
      data: {} as Record<string, unknown>,
      disconnect: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    tokenService = { verifyAccessToken: jest.fn() };
    boardRepository = { findById: jest.fn() };
    membershipChecker = { assertMember: jest.fn() };
    gateway = new BoardEventsGateway(
      tokenService as unknown as TokenService,
      boardRepository as unknown as BoardRepository,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  describe('handleConnection', () => {
    it('disconnects the client when no token is provided', () => {
      const client = makeClient();

      gateway.handleConnection(client as any);

      expect(client.disconnect).toHaveBeenCalled();
      expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('disconnects the client when the token is invalid', () => {
      const client = makeClient({ token: 'bad-token' });
      tokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('invalid');
      });

      gateway.handleConnection(client as any);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('stores the userId on the socket when the token is valid', () => {
      const client = makeClient({ token: 'good-token' });
      tokenService.verifyAccessToken.mockReturnValue({ sub: 'user-1', email: 'a@example.com' });

      gateway.handleConnection(client as any);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.userId).toBe('user-1');
    });
  });

  describe('handleJoinBoard', () => {
    it('does nothing when the board does not exist', async () => {
      const client = makeClient();
      boardRepository.findById.mockResolvedValue(null);

      await gateway.handleJoinBoard(client as any, { boardId: 'missing' });

      expect(client.join).not.toHaveBeenCalled();
    });

    it('does not join the room when the user is not a member of the board organization', async () => {
      const client = makeClient();
      client.data.userId = 'outsider';
      boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
      membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

      await gateway.handleJoinBoard(client as any, { boardId: 'board-1' });

      expect(client.join).not.toHaveBeenCalled();
    });

    it('joins the board room when the user is a member', async () => {
      const client = makeClient();
      client.data.userId = 'user-1';
      boardRepository.findById.mockResolvedValue(new Board('board-1', 'org-1', 'Sprint 1', null));
      membershipChecker.assertMember.mockResolvedValue(undefined);

      await gateway.handleJoinBoard(client as any, { boardId: 'board-1' });

      expect(client.join).toHaveBeenCalledWith('board:board-1');
    });
  });

  it('leaves the board room', async () => {
    const client = makeClient();

    await gateway.handleLeaveBoard(client as any, { boardId: 'board-1' });

    expect(client.leave).toHaveBeenCalledWith('board:board-1');
  });

  describe('notifyBoardEvent', () => {
    it('emits the event to the board room when the server is attached', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as any).server = { to };

      gateway.notifyBoardEvent('board-1', { type: 'task.created', payload: { id: 'task-1' } });

      expect(to).toHaveBeenCalledWith('board:board-1');
      expect(emit).toHaveBeenCalledWith('board-event', { type: 'task.created', payload: { id: 'task-1' } });
    });

    it('does not throw when the server is not yet attached', () => {
      expect(() =>
        gateway.notifyBoardEvent('board-1', { type: 'task.created', payload: {} }),
      ).not.toThrow();
    });
  });
});
