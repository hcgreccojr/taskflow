import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationsStore } from '../store/organizationsStore';
import { EditOrganizationModal } from '../components/EditOrganizationModal';
import { Topbar } from '../../../shared/components/Topbar';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useToastStore } from '../../../shared/store/toastStore';
import { ApiError } from '../../../services/httpClient';
import type { Organization } from '../../../shared/types/api';
import styles from './OrganizationsPage.module.css';

export function OrganizationsPage() {
  const organizations = useOrganizationsStore((state) => state.organizations);
  const fetchOrganizations = useOrganizationsStore((state) => state.fetchOrganizations);
  const createOrganization = useOrganizationsStore((state) => state.createOrganization);
  const updateOrganization = useOrganizationsStore((state) => state.updateOrganization);
  const deleteOrganization = useOrganizationsStore((state) => state.deleteOrganization);
  const pushToast = useToastStore((state) => state.push);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [confirmingDeleteOrg, setConfirmingDeleteOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await createOrganization(name.trim());
    setName('');
    setCreating(false);
    pushToast('Organização criada');
  }

  async function onSaveOrganization(data: { name: string }) {
    if (!editingOrg) return;
    await updateOrganization(editingOrg.id, data.name);
    pushToast('Organização atualizada');
  }

  async function onConfirmDeleteOrganization() {
    if (!confirmingDeleteOrg) return;
    try {
      await deleteOrganization(confirmingDeleteOrg.id);
      pushToast('Organização excluída');
    } catch (err) {
      pushToast(
        err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível excluir a organização',
        'error',
      );
    } finally {
      setConfirmingDeleteOrg(null);
    }
  }

  return (
    <div>
      <Topbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Organizações</h1>
            <p className={styles.subtitle}>Escolha uma organização para ver seus quadros.</p>
          </div>
        </div>

        {creating && (
          <form className={styles.createForm} onSubmit={onCreate}>
            <TextField
              placeholder="Nome da organização"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
            <Button type="submit">Criar</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </form>
        )}

        <div className={styles.grid}>
          {organizations.map((org) => (
            <div key={org.id} className={styles.card}>
              <Link to={`/orgs/${org.id}`} className={styles.cardLink}>
                <span className={styles.cardName}>{org.name}</span>
              </Link>
              <div className={styles.cardActions}>
                <Button variant="ghost" onClick={() => setEditingOrg(org)}>
                  Editar
                </Button>
                {org.role === 'ADMIN' && (
                  <Button variant="ghost" onClick={() => setConfirmingDeleteOrg(org)}>
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!creating && (
            <button type="button" className={styles.newCard} onClick={() => setCreating(true)}>
              + Nova organização
            </button>
          )}
        </div>
      </div>

      {editingOrg && (
        <EditOrganizationModal
          organization={editingOrg}
          onSave={onSaveOrganization}
          onClose={() => setEditingOrg(null)}
        />
      )}

      {confirmingDeleteOrg && (
        <ConfirmDialog
          title="Excluir organização"
          description={`Todos os quadros, colunas, tarefas, membros e convites de "${confirmingDeleteOrg.name}" serão excluídos permanentemente. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir organização"
          onConfirm={onConfirmDeleteOrganization}
          onCancel={() => setConfirmingDeleteOrg(null)}
        />
      )}
    </div>
  );
}
