import { ForbiddenException } from '@nestjs/common';
import { ListCommentsUseCase } from './list-comments.use-case';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';

describe('ListCommentsUseCase', () => {
  let useCase: ListCommentsUseCase;
  let taskAccessService: { resolve: jest.Mock };
  let commentRepository: { findByTaskId: jest.Mock };

  beforeEach(() => {
    taskAccessService = { resolve: jest.fn().mockResolvedValue({}) };
    commentRepository = { findByTaskId: jest.fn() };
    useCase = new ListCommentsUseCase(
      taskAccessService as unknown as TaskAccessService,
      commentRepository as any,
    );
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    taskAccessService.resolve.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute({ requesterId: 'user-1', taskId: 'task-1' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns the comments for the task after authorizing', async () => {
    const comments = [new Comment('comment-1', 'task-1', 'user-1', 'Olá', new Date())];
    commentRepository.findByTaskId.mockResolvedValue(comments);

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1' });

    expect(taskAccessService.resolve).toHaveBeenCalledWith('task-1', 'user-1');
    expect(commentRepository.findByTaskId).toHaveBeenCalledWith('task-1');
    expect(result).toBe(comments);
  });
});
