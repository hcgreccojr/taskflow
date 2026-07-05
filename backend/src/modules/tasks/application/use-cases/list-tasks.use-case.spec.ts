import { ListTasksUseCase } from './list-tasks.use-case';
import { Task, TaskPriority } from '../../domain/task.entity';

describe('ListTasksUseCase', () => {
  let useCase: ListTasksUseCase;
  let taskRepository: { findMany: jest.Mock };

  beforeEach(() => {
    taskRepository = { findMany: jest.fn() };
    useCase = new ListTasksUseCase(taskRepository as any);
  });

  it('forwards the combined filters to the repository', async () => {
    const tasks = [new Task('task-1', 'col-1', 'Tarefa', null, null, null, 0, TaskPriority.MEDIUM, new Date())];
    taskRepository.findMany.mockResolvedValue(tasks);
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
    });
    expect(result).toBe(tasks);
  });

  it('works with only the requester scope and no optional filters', async () => {
    taskRepository.findMany.mockResolvedValue([]);

    await useCase.execute({ requesterId: 'user-1' });

    expect(taskRepository.findMany).toHaveBeenCalledWith({
      requesterId: 'user-1',
      assigneeId: undefined,
      columnId: undefined,
      dueBefore: undefined,
      search: undefined,
    });
  });
});
