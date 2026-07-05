import { Inject, Injectable } from '@nestjs/common';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';
import { CommentRepository, COMMENT_REPOSITORY } from '../ports/comment-repository.port';

export interface ListCommentsInput {
  requesterId: string;
  taskId: string;
}

@Injectable()
export class ListCommentsUseCase {
  constructor(
    private readonly taskAccessService: TaskAccessService,
    @Inject(COMMENT_REPOSITORY) private readonly commentRepository: CommentRepository,
  ) {}

  async execute(input: ListCommentsInput): Promise<Comment[]> {
    await this.taskAccessService.resolve(input.taskId, input.requesterId);

    return this.commentRepository.findByTaskId(input.taskId);
  }
}
