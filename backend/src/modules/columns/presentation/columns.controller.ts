import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateColumnUseCase } from '../application/use-cases/create-column.use-case';
import { ReorderColumnUseCase } from '../application/use-cases/reorder-column.use-case';
import { ListColumnsUseCase } from '../application/use-cases/list-columns.use-case';
import { DeleteColumnUseCase } from '../application/use-cases/delete-column.use-case';
import { CreateColumnDto } from './dto/create-column.dto';
import { ReorderColumnDto } from './dto/reorder-column.dto';
import { ColumnResponseDto } from './dto/column-response.dto';

@ApiTags('columns')
@ApiBearerAuth()
@Controller()
export class ColumnsController {
  constructor(
    private readonly createColumnUseCase: CreateColumnUseCase,
    private readonly reorderColumnUseCase: ReorderColumnUseCase,
    private readonly listColumnsUseCase: ListColumnsUseCase,
    private readonly deleteColumnUseCase: DeleteColumnUseCase,
  ) {}

  @Get('boards/:id/columns')
  @ApiOperation({ summary: 'Listar colunas de um quadro' })
  @ApiOkResponse({ type: ColumnResponseDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async list(
    @CurrentUser() user: TokenPayload,
    @Param('id') boardId: string,
  ): Promise<ColumnResponseDto[]> {
    const columns = await this.listColumnsUseCase.execute({
      requesterId: user.sub,
      boardId,
    });
    return columns.map(ColumnResponseDto.fromDomain);
  }

  @Post('boards/:id/columns')
  @ApiOperation({ summary: 'Criar coluna' })
  @ApiCreatedResponse({ type: ColumnResponseDto })
  @ApiResponse({ status: 404, description: 'Quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async create(
    @CurrentUser() user: TokenPayload,
    @Param('id') boardId: string,
    @Body() dto: CreateColumnDto,
  ): Promise<ColumnResponseDto> {
    const column = await this.createColumnUseCase.execute({
      requesterId: user.sub,
      boardId,
      name: dto.name,
    });
    return ColumnResponseDto.fromDomain(column);
  }

  @Patch('columns/:id/reorder')
  @ApiOperation({ summary: 'Reordenar coluna dentro do quadro' })
  @ApiOkResponse({ type: ColumnResponseDto, isArray: true, description: 'Todas as colunas do quadro, já reordenadas' })
  @ApiResponse({ status: 404, description: 'Coluna não encontrada' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async reorder(
    @CurrentUser() user: TokenPayload,
    @Param('id') columnId: string,
    @Body() dto: ReorderColumnDto,
  ): Promise<ColumnResponseDto[]> {
    const columns = await this.reorderColumnUseCase.execute({
      requesterId: user.sub,
      columnId,
      order: dto.order,
    });
    return columns.map(ColumnResponseDto.fromDomain);
  }

  @Delete('columns/:id')
  @ApiOperation({
    summary:
      'Excluir coluna (RN-004: tarefas são movidas para a primeira coluna restante; bloqueado se for a única)',
  })
  @ApiResponse({ status: 200, description: 'Coluna excluída' })
  @ApiResponse({ status: 404, description: 'Coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  @ApiResponse({ status: 400, description: 'Coluna é a única do quadro — não há destino para as tarefas' })
  async delete(@CurrentUser() user: TokenPayload, @Param('id') columnId: string): Promise<void> {
    await this.deleteColumnUseCase.execute({ requesterId: user.sub, columnId });
  }
}
