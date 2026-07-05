import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
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
import { CreateCommentUseCase } from '../application/use-cases/create-comment.use-case';
import { ListCommentsUseCase } from '../application/use-cases/list-comments.use-case';
import { UpdateCommentUseCase } from '../application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from '../application/use-cases/delete-comment.use-case';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly listCommentsUseCase: ListCommentsUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Comentar em uma tarefa' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async create(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.createCommentUseCase.execute({
      requesterId: user.sub,
      taskId,
      content: dto.content,
    });
    return CommentResponseDto.fromDomain(comment);
  }

  @Get('tasks/:id/comments')
  @ApiOperation({ summary: 'Listar comentários de uma tarefa' })
  @ApiOkResponse({ type: CommentResponseDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização do quadro' })
  async list(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
  ): Promise<CommentResponseDto[]> {
    const comments = await this.listCommentsUseCase.execute({ requesterId: user.sub, taskId });
    return comments.map(CommentResponseDto.fromDomain);
  }

  @Patch('comments/:id')
  @ApiOperation({ summary: 'Editar comentário (até 15 minutos após a criação, apenas o autor)' })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiResponse({ status: 404, description: 'Comentário, tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas o autor pode editar este comentário' })
  @ApiResponse({ status: 422, description: 'Janela de 15 minutos para edição já expirou' })
  async update(
    @CurrentUser() user: TokenPayload,
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.updateCommentUseCase.execute({
      requesterId: user.sub,
      commentId,
      content: dto.content,
    });
    return CommentResponseDto.fromDomain(comment);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Excluir comentário (apenas o autor, sem limite de tempo)' })
  @ApiResponse({ status: 200, description: 'Comentário excluído' })
  @ApiResponse({ status: 404, description: 'Comentário, tarefa, coluna ou quadro não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas o autor pode excluir este comentário' })
  async delete(@CurrentUser() user: TokenPayload, @Param('id') commentId: string): Promise<void> {
    await this.deleteCommentUseCase.execute({ requesterId: user.sub, commentId });
  }
}
