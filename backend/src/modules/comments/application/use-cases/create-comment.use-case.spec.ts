import { ForbiddenException } from '@nestjs/common';
import { CreateCommentUseCase } from './create-comment.use-case';
import { TaskAccessService } from '../../../tasks/application/services/task-access.service';
import { Comment } from '../../domain/comment.entity';

describe('CreateCommentUseCase', () => {
  let useCase: CreateCommentUseCase;
  let taskAccessService: { resolve: jest.Mock };
  let commentRepository: { create: jest.Mock };

  beforeEach(() => {
    taskAccessService = { resolve: jest.fn().mockResolvedValue({}) };
    commentRepository = { create: jest.fn() };
    useCase = new CreateCommentUseCase(
      taskAccessService as unknown as TaskAccessService,
      commentRepository as any,
    );
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    taskAccessService.resolve.mockRejectedValue(new ForbiddenException());

    await expect(
      useCase.execute({ requesterId: 'user-1', taskId: 'task-1', content: 'Olá' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates the comment with the requester as author', async () => {
    const created = new Comment('comment-1', 'task-1', 'user-1', 'Olá', new Date());
    commentRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({ requesterId: 'user-1', taskId: 'task-1', content: 'Olá' });

    expect(taskAccessService.resolve).toHaveBeenCalledWith('task-1', 'user-1');
    expect(commentRepository.create).toHaveBeenCalledWith({
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Olá',
    });
    expect(result).toBe(created);
  });
});
