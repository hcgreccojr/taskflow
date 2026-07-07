import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationsPage } from './OrganizationsPage';
import type { Organization } from '../../../shared/types/api';

const fetchOrganizations = vi.fn();
const createOrganization = vi.fn();
const updateOrganization = vi.fn();
const deleteOrganization = vi.fn();

let organizations: Organization[] = [];

interface FakeOrganizationsState {
  organizations: Organization[];
  fetchOrganizations: typeof fetchOrganizations;
  createOrganization: typeof createOrganization;
  updateOrganization: typeof updateOrganization;
  deleteOrganization: typeof deleteOrganization;
}

vi.mock('../store/organizationsStore', () => ({
  useOrganizationsStore: (selector: (state: FakeOrganizationsState) => unknown) =>
    selector({ organizations, fetchOrganizations, createOrganization, updateOrganization, deleteOrganization }),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <OrganizationsPage />
    </MemoryRouter>,
  );
}

describe('OrganizationsPage', () => {
  beforeEach(() => {
    updateOrganization.mockReset();
    deleteOrganization.mockReset();
  });

  it('shows "Editar" for every organization regardless of role', () => {
    organizations = [
      { id: 'org-1', name: 'Org Admin', ownerId: 'user-1', createdAt: new Date().toISOString(), role: 'ADMIN' },
      { id: 'org-2', name: 'Org Member', ownerId: 'user-2', createdAt: new Date().toISOString(), role: 'MEMBER' },
    ];

    renderPage();

    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
  });

  it('shows "Excluir" only for organizations where the user is ADMIN', () => {
    organizations = [
      { id: 'org-1', name: 'Org Admin', ownerId: 'user-1', createdAt: new Date().toISOString(), role: 'ADMIN' },
      { id: 'org-2', name: 'Org Member', ownerId: 'user-2', createdAt: new Date().toISOString(), role: 'MEMBER' },
    ];

    renderPage();

    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(1);
  });

  it('opens the edit modal and saves the new name', async () => {
    organizations = [
      { id: 'org-1', name: 'Org Original', ownerId: 'user-1', createdAt: new Date().toISOString(), role: 'MEMBER' },
    ];
    updateOrganization.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('heading', { name: 'Editar organização' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(updateOrganization).toHaveBeenCalledWith('org-1', 'Org Original'));
  });

  it('confirms and deletes the organization', async () => {
    organizations = [
      { id: 'org-1', name: 'Org Admin', ownerId: 'user-1', createdAt: new Date().toISOString(), role: 'ADMIN' },
    ];
    deleteOrganization.mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(screen.getByRole('heading', { name: 'Excluir organização' })).toBeInTheDocument();
    expect(deleteOrganization).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir organização' }));

    await waitFor(() => expect(deleteOrganization).toHaveBeenCalledWith('org-1'));
  });
});
