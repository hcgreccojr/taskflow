import { Membership, MembershipRole } from '../../domain/membership.entity';

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');

export interface CreateMembershipData {
  userId: string;
  organizationId: string;
  role: MembershipRole;
}

export interface MembershipRepository {
  findByUserAndOrganization(userId: string, organizationId: string): Promise<Membership | null>;
  create(data: CreateMembershipData): Promise<Membership>;
}
