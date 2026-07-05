import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MembersPage } from './MembersPage';
import type { Member } from '../../../shared/types/api';

const fetchMembers = vi.fn();
const inviteMember = vi.fn();
const removeMember = vi.fn();

let members: Member[] = [];

interface FakeOrganizationsState {
  membersByOrg: Record<string, Member[]>;
  fetchMembers: typeof fetchMembers;
  inviteMember: typeof inviteMember;
  removeMember: typeof removeMember;
}

interface FakeAuthState {
  user: { id: string; name: string; email: string; createdAt: string };
  logout: () => void;
}

vi.mock('../store/organizationsStore', () => ({
  useOrganizationsStore: (selector: (state: FakeOrganizationsState) => unknown) =>
    selector({ membersByOrg: { 'org-1': members }, fetchMembers, inviteMember, removeMember }),
}));

vi.mock('../../auth/store/authStore', () => ({
  useAuthStore: (selector: (state: FakeAuthState) => unknown) =>
    selector({
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com', createdAt: new Date().toISOString() },
      logout: vi.fn(),
    }),
}));

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
});
