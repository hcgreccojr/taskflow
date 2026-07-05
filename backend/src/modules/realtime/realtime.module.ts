import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BoardsModule } from '../boards/boards.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { REALTIME_NOTIFIER } from './application/ports/realtime-notifier.port';
import { BoardEventsGateway } from './infrastructure/board-events.gateway';

@Module({
  imports: [AuthModule, BoardsModule, OrganizationsModule],
  providers: [BoardEventsGateway, { provide: REALTIME_NOTIFIER, useExisting: BoardEventsGateway }],
  exports: [REALTIME_NOTIFIER],
})
export class RealtimeModule {}
