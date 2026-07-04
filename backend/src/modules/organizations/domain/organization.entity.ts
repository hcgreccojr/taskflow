export class Organization {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly createdAt: Date,
  ) {}
}
