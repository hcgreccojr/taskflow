import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/update-task.use-case';
import { MoveTaskUseCase } from '../application/use-cases/move-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/delete-task.use-case';
import { ListTasksUseCase } from '../application/use-cases/list-tasks.use-case';
import { ListActivityUseCase } from '../application/use-cases/list-activity.use-case';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskListResponseDto } from './dto/task-list-response.dto';
import { ActivityLogResponseDto } from './dto/activity-log-response.dto';

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
    private readonly listActivityUseCase: ListActivityUseCase,
  ) {}

  @Post('columns/:id/tasks')
  @ApiOperation({ summary: 'Criar tarefa em uma coluna' })
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  @ApiResponse({ status: 422, description: 'Responsável informado não é membro da organização' })
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
  @ApiOperation({ summary: 'Editar título, descrição, prazo, responsável e/ou prioridade de uma tarefa' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  @ApiResponse({ status: 422, description: 'Responsável informado não é membro da organização' })
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
  @ApiOperation({ summary: 'Mover tarefa entre colunas do mesmo quadro' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna de origem/destino ou quadro não encontrado' })
  @ApiResponse({ status: 400, description: 'Coluna de destino pertence a outro quadro' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
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
  @ApiOperation({ summary: 'Excluir tarefa (definitivo)' })
  @ApiResponse({ status: 200, description: 'Tarefa excluída' })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async delete(@CurrentUser() user: TokenPayload, @Param('id') taskId: string): Promise<void> {
    await this.deleteTaskUseCase.execute({ requesterId: user.sub, taskId });
  }

  @Get('tasks')
  @ApiOperation({
    summary: 'Buscar/filtrar tarefas por responsável, coluna, prazo e/ou título (paginado)',
  })
  @ApiOkResponse({ type: TaskListResponseDto })
  async list(
    @CurrentUser() user: TokenPayload,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskListResponseDto> {
    const result = await this.listTasksUseCase.execute({
      requesterId: user.sub,
      assigneeId: query.assigneeId,
      columnId: query.status,
      dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
    return { data: result.data.map(TaskResponseDto.fromDomain), meta: result.meta };
  }

  @Get('tasks/:id/activity')
  @ApiOperation({ summary: 'Consultar histórico de atividades de uma tarefa' })
  @ApiOkResponse({ type: ActivityLogResponseDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async listActivity(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
  ): Promise<ActivityLogResponseDto[]> {
    const entries = await this.listActivityUseCase.execute({ requesterId: user.sub, taskId });
    return entries.map(ActivityLogResponseDto.fromDomain);
  }
}
