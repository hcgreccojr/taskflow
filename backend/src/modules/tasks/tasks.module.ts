import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { ColumnsModule } from '../columns/columns.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TASK_REPOSITORY } from './application/ports/task-repository.port';
import { PrismaTaskRepository } from './infrastructure/prisma-task.repository';
import { CreateTaskUseCase } from './application/use-cases/create-task.use-case';
import { UpdateTaskUseCase } from './application/use-cases/update-task.use-case';
import { MoveTaskUseCase } from './application/use-cases/move-task.use-case';
import { DeleteTaskUseCase } from './application/use-cases/delete-task.use-case';
import { ListTasksUseCase } from './application/use-cases/list-tasks.use-case';
import { TasksController } from './presentation/tasks.controller';

@Module({
  imports: [BoardsModule, ColumnsModule, OrganizationsModule],
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    CreateTaskUseCase,
    UpdateTaskUseCase,
    MoveTaskUseCase,
    DeleteTaskUseCase,
    ListTasksUseCase,
  ],
})
export class TasksModule {}
