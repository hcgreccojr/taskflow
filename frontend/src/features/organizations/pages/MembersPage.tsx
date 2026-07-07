import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useOrganizationsStore } from '../store/organizationsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { EditOrganizationModal } from '../components/EditOrganizationModal';
import { Topbar } from '../../../shared/components/Topbar';
import { Avatar } from '../../../shared/components/Avatar';
import { TextField } from '../../../shared/components/TextField';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { useToastStore } from '../../../shared/store/toastStore';
import { ApiError } from '../../../services/httpClient';
import { emptyArray } from '../../../shared/utils/emptyArray';
import type { Member, MembershipRole } from '../../../shared/types/api';
import styles from './MembersPage.module.css';

export function MembersPage() {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const organizations = useOrganizationsStore((state) => state.organizations);
  const fetchOrganizations = useOrganizationsStore((state) => state.fetchOrganizations);
  const updateOrganization = useOrganizationsStore((state) => state.updateOrganization);
  const deleteOrganization = useOrganizationsStore((state) => state.deleteOrganization);
  const members = useOrganizationsStore((state) => state.membersByOrg[orgId] ?? emptyArray<Member>());
  const fetchMembers = useOrganizationsStore((state) => state.fetchMembers);
  const inviteMember = useOrganizationsStore((state) => state.inviteMember);
  const removeMember = useOrganizationsStore((state) => state.removeMember);
  const pushToast = useToastStore((state) => state.push);

  const organization = organizations.find((org) => org.id === orgId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [editingOrg, setEditingOrg] = useState(false);
  const [confirmingDeleteOrg, setConfirmingDeleteOrg] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    fetchMembers(orgId);
    if (organizations.length === 0) fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, fetchMembers, fetchOrganizations]);

  const isAdmin = members.some((member) => member.userId === currentUser?.id && member.role === 'ADMIN');

  async function onSaveOrganization(data: { name: string }) {
    await updateOrganization(orgId, data.name);
    pushToast('Organização atualizada');
  }

  async function onConfirmDeleteOrganization() {
    try {
      await deleteOrganization(orgId);
      pushToast('Organização excluída');
      navigate('/orgs');
    } catch (err) {
      pushToast(
        err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível excluir a organização',
        'error',
      );
    } finally {
      setConfirmingDeleteOrg(false);
    }
  }

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await inviteMember(orgId, email.trim(), role);
      setEmail('');
      pushToast(
        result.status === 'joined'
          ? 'Convite enviado'
          : 'E-mail ainda não tem conta — será adicionado automaticamente assim que se cadastrar.',
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível convidar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirmRemove() {
    if (!removingMember) return;
    try {
      await removeMember(orgId, removingMember.id);
      pushToast('Membro removido');
    } catch (err) {
      pushToast(
        err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível remover o membro',
        'error',
      );
    } finally {
      setRemovingMember(null);
    }
  }

  return (
    <div>
      <Topbar organizationId={orgId} />
      <div className={styles.content}>
        <Link to={`/orgs/${orgId}`} className={styles.breadcrumb}>
          ← Quadros
        </Link>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Membros</h1>
          <div className={styles.titleActions}>
            <Button variant="ghost" onClick={() => setEditingOrg(true)}>
              Editar organização
            </Button>
            {isAdmin && (
              <Button variant="ghost" onClick={() => setConfirmingDeleteOrg(true)}>
                Excluir organização
              </Button>
            )}
          </div>
        </div>

        <div className={styles.list}>
          {members.map((member) => (
            <div key={member.id} className={styles.row}>
              <Avatar name={member.name} />
              <div className={styles.rowInfo}>
                <div className={styles.rowName}>{member.name}</div>
                <div className={styles.rowEmail}>{member.email}</div>
              </div>
              <span className={`${styles.badge} ${member.role === 'ADMIN' ? styles.badgeAdmin : ''}`}>
                {member.role}
              </span>
              {isAdmin && (
                <Button variant="ghost" onClick={() => setRemovingMember(member)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>

        {isAdmin ? (
          <div className={styles.inviteBlock}>
            <p className={styles.inviteTitle}>Convidar membro</p>
            <form className={styles.inviteForm} onSubmit={onInvite}>
              <TextField
                type="email"
                placeholder="e-mail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Select value={role} onChange={(event) => setRole(event.target.value as MembershipRole)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Button type="submit" disabled={submitting}>
                Convidar
              </Button>
            </form>
            {error && <p className={styles.note}>{error}</p>}
          </div>
        ) : (
          <p className={styles.note}>Apenas administradores podem convidar membros.</p>
        )}
      </div>

      {removingMember && (
        <ConfirmDialog
          title="Remover membro"
          description={`${removingMember.name} perderá o acesso a esta organização. Esta ação não pode ser desfeita.`}
          confirmLabel="Remover membro"
          onConfirm={onConfirmRemove}
          onCancel={() => setRemovingMember(null)}
        />
      )}

      {editingOrg && organization && (
        <EditOrganizationModal
          organization={organization}
          onSave={onSaveOrganization}
          onClose={() => setEditingOrg(false)}
        />
      )}

      {confirmingDeleteOrg && (
        <ConfirmDialog
          title="Excluir organização"
          description="Todos os quadros, colunas, tarefas, membros e convites desta organização serão excluídos permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Excluir organização"
          onConfirm={onConfirmDeleteOrganization}
          onCancel={() => setConfirmingDeleteOrg(false)}
        />
      )}
    </div>
  );
}
