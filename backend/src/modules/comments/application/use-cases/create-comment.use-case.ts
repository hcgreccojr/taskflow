import { Inject, Injectable } from '@nestjs/common';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';
import { CommentRepository, COMMENT_REPOSITORY } from '../ports/comment-repository.port';

export interface CreateCommentInput {
  requesterId: string;
  taskId: string;
  content: string;
}

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly taskAccessService: TaskAccessService,
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: CommentRepository,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    await this.taskAccessService.resolve(input.taskId, input.requesterId);

    return this.commentRepository.create({
      taskId: input.taskId,
      authorId: input.requesterId,
      content: input.content,
    });
  }
}
