import { request } from './httpClient';
import type { Member, Membership, MembershipRole, Organization } from '../shared/types/api';

export function listOrganizations(): Promise<Organization[]> {
  return request('/organizations');
}

export function createOrganization(name: string): Promise<Organization> {
  return request('/organizations', { method: 'POST', body: { name } });
}

export function listMembers(organizationId: string): Promise<Member[]> {
  return request(`/organizations/${organizationId}/members`);
}

export function inviteMember(
  organizationId: string,
  data: { email: string; role?: MembershipRole },
): Promise<Membership> {
  return request(`/organizations/${organizationId}/invites`, { method: 'POST', body: data });
}
