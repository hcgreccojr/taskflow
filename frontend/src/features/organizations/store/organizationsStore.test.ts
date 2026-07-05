import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrganizationsStore } from './organizationsStore';
import * as organizationsApi from '../../../services/organizationsApi';

vi.mock('../../../services/organizationsApi');

describe('organizationsStore', () => {
  beforeEach(() => {
    useOrganizationsStore.setState({ organizations: [], membersByOrg: {}, loading: false });
    vi.resetAllMocks();
  });

  it('fetchOrganizations loads the list', async () => {
    vi.mocked(organizationsApi.listOrganizations).mockResolvedValue([
      { id: 'org-1', name: 'Acme', ownerId: 'user-1', createdAt: new Date().toISOString() },
    ]);

    await useOrganizationsStore.getState().fetchOrganizations();

    expect(useOrganizationsStore.getState().organizations).toHaveLength(1);
  });

  it('createOrganization appends the created organization to state', async () => {
    const created = { id: 'org-2', name: 'Nova Org', ownerId: 'user-1', createdAt: new Date().toISOString() };
    vi.mocked(organizationsApi.createOrganization).mockResolvedValue(created);

    const result = await useOrganizationsStore.getState().createOrganization('Nova Org');

    expect(result).toEqual(created);
    expect(useOrganizationsStore.getState().organizations).toContainEqual(created);
  });

  it('fetchMembers caches the members list per organization', async () => {
    const members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN' as const, name: 'Ana', email: 'ana@example.com' },
    ];
    vi.mocked(organizationsApi.listMembers).mockResolvedValue(members);

    await useOrganizationsStore.getState().fetchMembers('org-1');

    expect(useOrganizationsStore.getState().membersByOrg['org-1']).toEqual(members);
  });

  it('inviteMember invites and refreshes the members cache', async () => {
    vi.mocked(organizationsApi.inviteMember).mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'MEMBER',
    });
    vi.mocked(organizationsApi.listMembers).mockResolvedValue([]);

    await useOrganizationsStore.getState().inviteMember('org-1', 'colega@example.com', 'MEMBER');

    expect(organizationsApi.inviteMember).toHaveBeenCalledWith('org-1', {
      email: 'colega@example.com',
      role: 'MEMBER',
    });
    expect(organizationsApi.listMembers).toHaveBeenCalledWith('org-1');
  });

  it('removeMember removes the membership from the cached list', async () => {
    useOrganizationsStore.setState({
      membersByOrg: {
        'org-1': [
          { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
          { id: 'm2', userId: 'user-2', organizationId: 'org-1', role: 'MEMBER', name: 'Bruno', email: 'bruno@example.com' },
        ],
      },
    });
    vi.mocked(organizationsApi.removeMember).mockResolvedValue(undefined);

    await useOrganizationsStore.getState().removeMember('org-1', 'm2');

    expect(organizationsApi.removeMember).toHaveBeenCalledWith('org-1', 'm2');
    expect(useOrganizationsStore.getState().membersByOrg['org-1']).toEqual([
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
    ]);
  });
});
