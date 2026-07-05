import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteCommentUseCase } from './delete-comment.use-case';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';

describe('DeleteCommentUseCase', () => {
  let useCase: DeleteCommentUseCase;
  let commentRepository: { findById: jest.Mock; delete: jest.Mock };
  let taskAccessService: { resolve: jest.Mock };

  beforeEach(() => {
    commentRepository = { findById: jest.fn(), delete: jest.fn() };
    taskAccessService = { resolve: jest.fn().mockResolvedValue({}) };
    useCase = new DeleteCommentUseCase(
      commentRepository as any,
      taskAccessService as unknown as TaskAccessService,
    );
  });

  it('throws NotFoundException when the comment does not exist', async () => {
    commentRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', commentId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the requester is not the author', async () => {
    commentRepository.findById.mockResolvedValue(
      new Comment('comment-1', 'task-1', 'author-1', 'Original', new Date()),
    );

    await expect(
      useCase.execute({ requesterId: 'other-user', commentId: 'comment-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deletes the comment regardless of elapsed time when requester is the author', async () => {
    const oldCreatedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    commentRepository.findById.mockResolvedValue(
      new Comment('comment-1', 'task-1', 'author-1', 'Original', oldCreatedAt),
    );

    await useCase.execute({ requesterId: 'author-1', commentId: 'comment-1' });

    expect(commentRepository.delete).toHaveBeenCalledWith('comment-1');
  });
});
