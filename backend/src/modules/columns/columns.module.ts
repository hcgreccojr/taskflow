import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { COLUMN_REPOSITORY } from './application/ports/column-repository.port';
import { PrismaColumnRepository } from './infrastructure/prisma-column.repository';
import { CreateColumnUseCase } from './application/use-cases/create-column.use-case';
import { ReorderColumnUseCase } from './application/use-cases/reorder-column.use-case';
import { ColumnsController } from './presentation/columns.controller';

@Module({
  imports: [BoardsModule, OrganizationsModule],
  controllers: [ColumnsController],
  providers: [
    { provide: COLUMN_REPOSITORY, useClass: PrismaColumnRepository },
    CreateColumnUseCase,
    ReorderColumnUseCase,
  ],
})
export class ColumnsModule {}
