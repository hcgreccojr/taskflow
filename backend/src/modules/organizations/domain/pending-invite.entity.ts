import { MembershipRole } from './membership.entity';

export class PendingInvite {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly email: string,
    public readonly role: MembershipRole,
    public readonly createdAt: Date,
  ) {}
}
