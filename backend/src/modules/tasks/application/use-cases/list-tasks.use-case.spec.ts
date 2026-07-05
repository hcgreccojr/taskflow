import { ListTasksUseCase } from './list-tasks.use-case';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('ListTasksUseCase', () => {
  let useCase: ListTasksUseCase;
  let taskRepository: { findMany: jest.Mock };

  beforeEach(() => {
    taskRepository = { findMany: jest.fn() };
    useCase = new ListTasksUseCase(taskRepository as any);
  });

  it('forwards the combined filters to the repository with default pagination', async () => {
    const tasks = [new Task('task-1', 'col-1', 'Tarefa', null, null, null, 0, TaskPriority.MEDIUM, new Date())];
    taskRepository.findMany.mockResolvedValue({ data: tasks, total: 1 });
    const dueBefore = new Date('2026-08-01');

    const result = await useCase.execute({
      requesterId: 'user-1',
      assigneeId: 'assignee-1',
      columnId: 'col-1',
      dueBefore,
      search: 'CI',
    });

    expect(taskRepository.findMany).toHaveBeenCalledWith({
      requesterId: 'user-1',
      assigneeId: 'assignee-1',
      columnId: 'col-1',
      dueBefore,
      search: 'CI',
      skip: 0,
      take: 50,
    });
    expect(result).toEqual({ data: tasks, meta: { page: 1, limit: 50, total: 1, totalPages: 1 } });
  });

  it('works with only the requester scope and no optional filters', async () => {
    taskRepository.findMany.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute({ requesterId: 'user-1' });

    expect(taskRepository.findMany).toHaveBeenCalledWith({
      requesterId: 'user-1',
      assigneeId: undefined,
      columnId: undefined,
      dueBefore: undefined,
      search: undefined,
      skip: 0,
      take: 50,
    });
  });

  it('computes skip/take from page and limit, capping limit at 100', async () => {
    taskRepository.findMany.mockResolvedValue({ data: [], total: 250 });

    const result = await useCase.execute({ requesterId: 'user-1', page: 3, limit: 500 });

    expect(taskRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 200, take: 100 }),
    );
    expect(result.meta).toEqual({ page: 3, limit: 100, total: 250, totalPages: 3 });
  });

  it('falls back to page 1 / default limit when given non-positive values', async () => {
    taskRepository.findMany.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute({ requesterId: 'user-1', page: 0, limit: -5 });

    expect(taskRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 }),
    );
  });
});
