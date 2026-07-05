import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { CommentRepository, COMMENT_REPOSITORY } from '../ports/comment-repository.port';

export interface DeleteCommentInput {
  requesterId: string;
  commentId: string;
}

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: CommentRepository,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async execute(input: DeleteCommentInput): Promise<void> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    await this.taskAccessService.resolve(comment.taskId, input.requesterId);

    if (comment.authorId !== input.requesterId) {
      throw new ForbiddenException('Apenas o autor pode excluir este comentário');
    }

    await this.commentRepository.delete(input.commentId);
  }
}
