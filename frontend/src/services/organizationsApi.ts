import { request } from './httpClient';
import type { InviteResult, Member, MembershipRole, Organization } from '../shared/types/api';

export function listOrganizations(): Promise<Organization[]> {
  return request('/organizations');
}

export function createOrganization(name: string): Promise<Organization> {
  return request('/organizations', { method: 'POST', body: { name } });
}

export function updateOrganization(organizationId: string, data: { name: string }): Promise<Organization> {
  return request(`/organizations/${organizationId}`, { method: 'PATCH', body: data });
}

/** Exclusão em cascata (boards, colunas, tarefas, memberships e convites); apenas ADMIN pode. */
export function deleteOrganization(organizationId: string): Promise<void> {
  return request(`/organizations/${organizationId}`, { method: 'DELETE' });
}

export function listMembers(organizationId: string): Promise<Member[]> {
  return request(`/organizations/${organizationId}/members`);
}

export function inviteMember(
  organizationId: string,
  data: { email: string; role?: MembershipRole },
): Promise<InviteResult> {
  return request(`/organizations/${organizationId}/invites`, { method: 'POST', body: data });
}

/** RN-002: apenas ADMIN pode remover membros. `membershipId` é o `id` retornado por listMembers. */
export function removeMember(organizationId: string, membershipId: string): Promise<void> {
  return request(`/organizations/${organizationId}/members/${membershipId}`, { method: 'DELETE' });
}
