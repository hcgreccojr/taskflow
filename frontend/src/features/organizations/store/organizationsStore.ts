import { create } from 'zustand';
import * as organizationsApi from '../../../services/organizationsApi';
import type { InviteResult, Member, MembershipRole, Organization } from '../../../shared/types/api';

interface OrganizationsState {
  organizations: Organization[];
  membersByOrg: Record<string, Member[]>;
  loading: boolean;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  updateOrganization: (organizationId: string, name: string) => Promise<Organization>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  fetchMembers: (organizationId: string) => Promise<void>;
  inviteMember: (organizationId: string, email: string, role?: MembershipRole) => Promise<InviteResult>;
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

  updateOrganization: async (organizationId, name) => {
    const updated = await organizationsApi.updateOrganization(organizationId, { name });
    let merged = updated;
    set((state) => ({
      organizations: state.organizations.map((org) => {
        if (org.id !== organizationId) return org;
        // PATCH não retorna `role` (o papel do usuário não muda ao editar); preserva o já conhecido.
        merged = { ...updated, role: org.role };
        return merged;
      }),
    }));
    return merged;
  },

  deleteOrganization: async (organizationId) => {
    await organizationsApi.deleteOrganization(organizationId);
    set((state) => {
      const membersByOrg = Object.fromEntries(
        Object.entries(state.membersByOrg).filter(([id]) => id !== organizationId),
      );
      return {
        organizations: state.organizations.filter((org) => org.id !== organizationId),
        membersByOrg,
      };
    });
  },

  fetchMembers: async (organizationId) => {
    const members = await organizationsApi.listMembers(organizationId);
    set((state) => ({ membersByOrg: { ...state.membersByOrg, [organizationId]: members } }));
  },

  inviteMember: async (organizationId, email, role) => {
    const result = await organizationsApi.inviteMember(organizationId, { email, role });
    await get().fetchMembers(organizationId);
    return result;
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
