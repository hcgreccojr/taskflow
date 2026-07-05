import { ForbiddenException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';
import { CommentRepository, COMMENT_REPOSITORY } from '../ports/comment-repository.port';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export interface UpdateCommentInput {
  requesterId: string;
  commentId: string;
  content: string;
}

@Injectable()
export class UpdateCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: CommentRepository,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async execute(input: UpdateCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    await this.taskAccessService.resolve(comment.taskId, input.requesterId);

    if (comment.authorId !== input.requesterId) {
      throw new ForbiddenException('Apenas o autor pode editar este comentário');
    }

    const elapsedMs = Date.now() - comment.createdAt.getTime();
    if (elapsedMs > EDIT_WINDOW_MS) {
      throw new UnprocessableEntityException(
        'Não é mais possível editar este comentário após 15 minutos da criação',
      );
    }

    return this.commentRepository.update(input.commentId, input.content);
  }
}
