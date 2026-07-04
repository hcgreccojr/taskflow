export class Column {
  constructor(
    public readonly id: string,
    public readonly boardId: string,
    public readonly name: string,
    public readonly order: number,
  ) {}
}
