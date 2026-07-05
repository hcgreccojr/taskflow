import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UpdateCommentUseCase } from './update-comment.use-case';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';

describe('UpdateCommentUseCase', () => {
  let useCase: UpdateCommentUseCase;
  let commentRepository: { findById: jest.Mock; update: jest.Mock };
  let taskAccessService: { resolve: jest.Mock };

  beforeEach(() => {
    commentRepository = { findById: jest.fn(), update: jest.fn() };
    taskAccessService = { resolve: jest.fn().mockResolvedValue({}) };
    useCase = new UpdateCommentUseCase(
      commentRepository as any,
      taskAccessService as unknown as TaskAccessService,
    );
  });

  it('throws NotFoundException when the comment does not exist', async () => {
    commentRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'user-1', commentId: 'missing', content: 'Editado' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the requester is not the author', async () => {
    commentRepository.findById.mockResolvedValue(
      new Comment('comment-1', 'task-1', 'author-1', 'Original', new Date()),
    );

    await expect(
      useCase.execute({ requesterId: 'other-user', commentId: 'comment-1', content: 'Editado' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws UnprocessableEntityException when the 15-minute window has expired', async () => {
    const createdAt = new Date(Date.now() - 16 * 60 * 1000);
    commentRepository.findById.mockResolvedValue(
      new Comment('comment-1', 'task-1', 'author-1', 'Original', createdAt),
    );

    await expect(
      useCase.execute({ requesterId: 'author-1', commentId: 'comment-1', content: 'Editado' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates the content when within the edit window and requester is the author', async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000);
    commentRepository.findById.mockResolvedValue(
      new Comment('comment-1', 'task-1', 'author-1', 'Original', createdAt),
    );
    const updated = new Comment('comment-1', 'task-1', 'author-1', 'Editado', createdAt);
    commentRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      requesterId: 'author-1',
      commentId: 'comment-1',
      content: 'Editado',
    });

    expect(taskAccessService.resolve).toHaveBeenCalledWith('task-1', 'author-1');
    expect(commentRepository.update).toHaveBeenCalledWith('comment-1', 'Editado');
    expect(result).toBe(updated);
  });
});
