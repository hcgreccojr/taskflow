import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MembersPage } from './MembersPage';
import type { Member, Organization } from '../../../shared/types/api';

const fetchMembers = vi.fn();
const inviteMember = vi.fn();
const removeMember = vi.fn();
const fetchOrganizations = vi.fn();
const updateOrganization = vi.fn();
const deleteOrganization = vi.fn();
const navigateMock = vi.fn();

let members: Member[] = [];
let organizations: Organization[] = [
  { id: 'org-1', name: 'Org Original', ownerId: 'user-1', createdAt: new Date().toISOString() },
];

interface FakeOrganizationsState {
  membersByOrg: Record<string, Member[]>;
  organizations: Organization[];
  fetchMembers: typeof fetchMembers;
  inviteMember: typeof inviteMember;
  removeMember: typeof removeMember;
  fetchOrganizations: typeof fetchOrganizations;
  updateOrganization: typeof updateOrganization;
  deleteOrganization: typeof deleteOrganization;
}

interface FakeAuthState {
  user: { id: string; name: string; email: string; createdAt: string };
  logout: () => void;
}

vi.mock('../store/organizationsStore', () => ({
  useOrganizationsStore: (selector: (state: FakeOrganizationsState) => unknown) =>
    selector({
      membersByOrg: { 'org-1': members },
      organizations,
      fetchMembers,
      inviteMember,
      removeMember,
      fetchOrganizations,
      updateOrganization,
      deleteOrganization,
    }),
}));

vi.mock('../../auth/store/authStore', () => ({
  useAuthStore: (selector: (state: FakeAuthState) => unknown) =>
    selector({
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com', createdAt: new Date().toISOString() },
      logout: vi.fn(),
    }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/orgs/org-1/members']}>
      <Routes>
        <Route path="/orgs/:orgId/members" element={<MembersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MembersPage', () => {
  beforeEach(() => {
    removeMember.mockReset();
    updateOrganization.mockReset();
    deleteOrganization.mockReset();
    fetchOrganizations.mockReset();
    navigateMock.mockReset();
    organizations = [{ id: 'org-1', name: 'Org Original', ownerId: 'user-1', createdAt: new Date().toISOString() }];
  });

  it('shows the invite form when the current user is an ADMIN', () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
    ];

    renderPage();

    expect(screen.getByText('Convidar membro')).toBeInTheDocument();
  });

  it('hides the invite form and shows a note when the current user is a MEMBER', () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'MEMBER', name: 'Ana', email: 'ana@example.com' },
    ];

    renderPage();

    expect(screen.queryByText('Convidar membro')).not.toBeInTheDocument();
    expect(screen.getByText('Apenas administradores podem convidar membros.')).toBeInTheDocument();
  });

  it('shows a Remover button per member when the current user is an ADMIN', () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
      { id: 'm2', userId: 'user-2', organizationId: 'org-1', role: 'MEMBER', name: 'Bruno', email: 'bruno@example.com' },
    ];

    renderPage();

    expect(screen.getAllByRole('button', { name: 'Remover' })).toHaveLength(2);
  });

  it('hides the Remover button when the current user is not an ADMIN', () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'MEMBER', name: 'Ana', email: 'ana@example.com' },
    ];

    renderPage();

    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument();
  });

  it('asks for confirmation and calls removeMember with the membership id', async () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
      { id: 'm2', userId: 'user-2', organizationId: 'org-1', role: 'MEMBER', name: 'Bruno', email: 'bruno@example.com' },
    ];
    removeMember.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[1]);
    expect(screen.getByRole('heading', { name: 'Remover membro' })).toBeInTheDocument();
    expect(removeMember).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remover membro' }));

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('org-1', 'm2'));
  });

  it('always shows the "Editar organização" button and saves the new name', async () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'MEMBER', name: 'Ana', email: 'ana@example.com' },
    ];
    updateOrganization.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Editar organização' }));
    expect(screen.getByRole('heading', { name: 'Editar organização' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(updateOrganization).toHaveBeenCalledWith('org-1', 'Org Original'));
  });

  it('hides the "Excluir organização" button when the current user is not an ADMIN', () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'MEMBER', name: 'Ana', email: 'ana@example.com' },
    ];

    renderPage();

    expect(screen.queryByRole('button', { name: 'Excluir organização' })).not.toBeInTheDocument();
  });

  it('confirms and deletes the organization, then navigates to /orgs', async () => {
    members = [
      { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'ADMIN', name: 'Ana', email: 'ana@example.com' },
    ];
    deleteOrganization.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir organização' }));
    expect(screen.getByRole('heading', { name: 'Excluir organização' })).toBeInTheDocument();
    expect(deleteOrganization).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole('button', { name: 'Excluir organização' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(deleteOrganization).toHaveBeenCalledWith('org-1'));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/orgs'));
  });
});
