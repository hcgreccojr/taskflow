import { forwardRef, Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TasksModule } from '../tasks/tasks.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { COLUMN_REPOSITORY } from './application/ports/column-repository.port';
import { PrismaColumnRepository } from './infrastructure/prisma-column.repository';
import { CreateColumnUseCase } from './application/use-cases/create-column.use-case';
import { ReorderColumnUseCase } from './application/use-cases/reorder-column.use-case';
import { ListColumnsUseCase } from './application/use-cases/list-columns.use-case';
import { DeleteColumnUseCase } from './application/use-cases/delete-column.use-case';
import { ColumnsController } from './presentation/columns.controller';

@Module({
  imports: [BoardsModule, OrganizationsModule, forwardRef(() => TasksModule), RealtimeModule],
  controllers: [ColumnsController],
  providers: [
    { provide: COLUMN_REPOSITORY, useClass: PrismaColumnRepository },
    CreateColumnUseCase,
    ReorderColumnUseCase,
    ListColumnsUseCase,
    DeleteColumnUseCase,
  ],
  exports: [COLUMN_REPOSITORY],
})
export class ColumnsModule {}
