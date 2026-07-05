export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class Task {
  constructor(
    public readonly id: string,
    public readonly columnId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly assigneeId: string | null,
    public readonly dueDate: Date | null,
    public readonly order: number,
    public readonly priority: TaskPriority,
    public readonly createdAt: Date,
  ) {}
}
