import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateColumnUseCase } from '../application/use-cases/create-column.use-case';
import { ReorderColumnUseCase } from '../application/use-cases/reorder-column.use-case';
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
  ) {}

  @Post('boards/:id/columns')
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
}
