import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationsStore } from '../store/organizationsStore';
import { Topbar } from '../../../shared/components/Topbar';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../shared/store/toastStore';
import styles from './OrganizationsPage.module.css';

export function OrganizationsPage() {
  const organizations = useOrganizationsStore((state) => state.organizations);
  const fetchOrganizations = useOrganizationsStore((state) => state.fetchOrganizations);
  const createOrganization = useOrganizationsStore((state) => state.createOrganization);
  const pushToast = useToastStore((state) => state.push);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

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
            <Link key={org.id} to={`/orgs/${org.id}`} className={styles.card}>
              <span className={styles.cardName}>{org.name}</span>
            </Link>
          ))}
          {!creating && (
            <button type="button" className={styles.newCard} onClick={() => setCreating(true)}>
              + Nova organização
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
