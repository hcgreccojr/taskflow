import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  async list(
    @CurrentUser() user: TokenPayload,
    @Param('id') taskId: string,
  ): Promise<CommentResponseDto[]> {
    const comments = await this.listCommentsUseCase.execute({ requesterId: user.sub, taskId });
    return comments.map(CommentResponseDto.fromDomain);
  }

  @Patch('comments/:id')
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
  async delete(@CurrentUser() user: TokenPayload, @Param('id') commentId: string): Promise<void> {
    await this.deleteCommentUseCase.execute({ requesterId: user.sub, commentId });
  }
}
