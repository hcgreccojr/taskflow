import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MembersPage } from './MembersPage';
import type { Member } from '../../../shared/types/api';

const fetchMembers = vi.fn();
const inviteMember = vi.fn();

let members: Member[] = [];

interface FakeOrganizationsState {
  membersByOrg: Record<string, Member[]>;
  fetchMembers: typeof fetchMembers;
  inviteMember: typeof inviteMember;
}

interface FakeAuthState {
  user: { id: string; name: string; email: string; createdAt: string };
  logout: () => void;
}

vi.mock('../store/organizationsStore', () => ({
  useOrganizationsStore: (selector: (state: FakeOrganizationsState) => unknown) =>
    selector({ membersByOrg: { 'org-1': members }, fetchMembers, inviteMember }),
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
});
