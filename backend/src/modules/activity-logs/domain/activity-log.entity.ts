export class ActivityLog {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly userId: string,
    public readonly action: string,
    public readonly createdAt: Date,
  ) {}
}
