export enum MembershipRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class Membership {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly role: MembershipRole,
  ) {}
}
