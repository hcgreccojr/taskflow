import { create } from 'zustand';
import * as organizationsApi from '../../../services/organizationsApi';
import type { Member, MembershipRole, Organization } from '../../../shared/types/api';

interface OrganizationsState {
  organizations: Organization[];
  membersByOrg: Record<string, Member[]>;
  loading: boolean;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  fetchMembers: (organizationId: string) => Promise<void>;
  inviteMember: (organizationId: string, email: string, role?: MembershipRole) => Promise<void>;
  removeMember: (organizationId: string, membershipId: string) => Promise<void>;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  organizations: [],
  membersByOrg: {},
  loading: false,

  fetchOrganizations: async () => {
    set({ loading: true });
    try {
      const organizations = await organizationsApi.listOrganizations();
      set({ organizations, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createOrganization: async (name) => {
    const organization = await organizationsApi.createOrganization(name);
    set((state) => ({ organizations: [...state.organizations, organization] }));
    return organization;
  },

  fetchMembers: async (organizationId) => {
    const members = await organizationsApi.listMembers(organizationId);
    set((state) => ({ membersByOrg: { ...state.membersByOrg, [organizationId]: members } }));
  },

  inviteMember: async (organizationId, email, role) => {
    await organizationsApi.inviteMember(organizationId, { email, role });
    await get().fetchMembers(organizationId);
  },

  removeMember: async (organizationId, membershipId) => {
    await organizationsApi.removeMember(organizationId, membershipId);
    set((state) => ({
      membersByOrg: {
        ...state.membersByOrg,
        [organizationId]: (state.membersByOrg[organizationId] ?? []).filter(
          (member) => member.id !== membershipId,
        ),
      },
    }));
  },
}));
