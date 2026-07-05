export class Comment {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly authorId: string,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
