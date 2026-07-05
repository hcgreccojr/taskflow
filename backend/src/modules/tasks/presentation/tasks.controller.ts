import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/update-task.use-case';
import { MoveTaskUseCase } from '../application/use-cases/move-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/delete-task.use-case';
import { ListTasksUseCase } from '../application/use-cases/list-tasks.use-case';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly moveTaskUseCase: MoveTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
  ) {}

  @Post('columns/:id/tasks')
  async create(
    @CurrentUser() user: TokenPayload,
    @Param('id') columnId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.createTaskUseCase.execute({
      requesterId: user.sub,
      columnId,
      title: dto.title,
      description: dto.description,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
    });
    return TaskResponseDto.fromDomain(task);
  }

  @Patch('tasks/:id')
  async update(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.updateTaskUseCase.execute({
      requesterId: user.sub,
      taskId,
      title: dto.title,
      description: dto.description,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
    });
    return TaskResponseDto.fromDomain(task);
  }

  @Patch('tasks/:id/move')
  async move(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
    @Body() dto: MoveTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.moveTaskUseCase.execute({
      requesterId: user.sub,
      taskId,
      columnId: dto.columnId,
      order: dto.order,
    });
    return TaskResponseDto.fromDomain(task);
  }

  @Delete('tasks/:id')
  async delete(@CurrentUser() user: TokenPayload, @Param('id') taskId: string): Promise<void> {
    await this.deleteTaskUseCase.execute({ requesterId: user.sub, taskId });
  }

  @Get('tasks')
  async list(
    @CurrentUser() user: TokenPayload,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.listTasksUseCase.execute({
      requesterId: user.sub,
      assigneeId: query.assigneeId,
      columnId: query.status,
      dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
      search: query.search,
    });
    return tasks.map(TaskResponseDto.fromDomain);
  }
}
