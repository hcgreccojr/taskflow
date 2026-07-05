import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService, TOKEN_SERVICE } from '../../auth/application/ports/token.service.port';
import { BoardRepository, BOARD_REPOSITORY } from '../../boards/application/ports/board-repository.port';
import { MembershipCheckerService } from '../../organizations/application/services/membership-checker.service';
import { BoardEvent, RealtimeNotifier } from '../application/ports/realtime-notifier.port';

const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: CORS_ORIGIN } })
export class BoardEventsGateway implements OnGatewayConnection, RealtimeNotifier {
  private readonly logger = new Logger(BoardEventsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join-board')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ): Promise<void> {
    const board = await this.boardRepository.findById(data.boardId);
    if (!board) return;

    try {
      await this.membershipChecker.assertMember(client.data.userId, board.organizationId);
    } catch {
      return;
    }

    await client.join(`board:${data.boardId}`);
  }

  @SubscribeMessage('leave-board')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ): Promise<void> {
    await client.leave(`board:${data.boardId}`);
  }

  notifyBoardEvent(boardId: string, event: BoardEvent): void {
    this.server?.to(`board:${boardId}`).emit('board-event', event);
    this.logger.debug(`board:${boardId} <- ${event.type}`);
  }
}
