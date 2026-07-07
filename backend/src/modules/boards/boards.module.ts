import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BOARD_REPOSITORY } from './application/ports/board-repository.port';
import { PrismaBoardRepository } from './infrastructure/prisma-board.repository';
import { CreateBoardUseCase } from './application/use-cases/create-board.use-case';
import { ListBoardsUseCase } from './application/use-cases/list-boards.use-case';
import { UpdateBoardUseCase } from './application/use-cases/update-board.use-case';
import { DeleteBoardUseCase } from './application/use-cases/delete-board.use-case';
import { BoardsController } from './presentation/boards.controller';

@Module({
  imports: [OrganizationsModule],
  controllers: [BoardsController],
  providers: [
    { provide: BOARD_REPOSITORY, useClass: PrismaBoardRepository },
    CreateBoardUseCase,
    ListBoardsUseCase,
    UpdateBoardUseCase,
    DeleteBoardUseCase,
  ],
  exports: [BOARD_REPOSITORY],
})
export class BoardsModule {}
