export class Board {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string,
    public readonly description: string | null,
  ) {}
}
