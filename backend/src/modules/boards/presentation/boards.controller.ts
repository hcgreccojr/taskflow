import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateBoardUseCase } from '../application/use-cases/create-board.use-case';
import { ListBoardsUseCase } from '../application/use-cases/list-boards.use-case';
import { CreateBoardDto } from './dto/create-board.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { BoardResponseDto } from './dto/board-response.dto';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardsController {
  constructor(
    private readonly createBoardUseCase: CreateBoardUseCase,
    private readonly listBoardsUseCase: ListBoardsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar quadros de uma organização' })
  @ApiOkResponse({ type: BoardResponseDto, isArray: true })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização' })
  async list(
    @CurrentUser() user: TokenPayload,
    @Query() query: ListBoardsQueryDto,
  ): Promise<BoardResponseDto[]> {
    const boards = await this.listBoardsUseCase.execute({
      requesterId: user.sub,
      organizationId: query.organizationId,
    });
    return boards.map(BoardResponseDto.fromDomain);
  }

  @Post()
  @ApiOperation({ summary: 'Criar quadro' })
  @ApiCreatedResponse({ type: BoardResponseDto })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização' })
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.createBoardUseCase.execute({
      requesterId: user.sub,
      organizationId: dto.organizationId,
      name: dto.name,
      description: dto.description,
    });
    return BoardResponseDto.fromDomain(board);
  }
}
