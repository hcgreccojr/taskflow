import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import type { Organization } from '../../../shared/types/api';
import styles from './EditOrganizationModal.module.css';

interface EditOrganizationModalProps {
  organization: Organization;
  onSave: (data: { name: string }) => Promise<void>;
  onClose: () => void;
}

export function EditOrganizationModal({ organization, onSave, onClose }: EditOrganizationModalProps) {
  const [name, setName] = useState(organization.name);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <form className={styles.content} onSubmit={onSubmit}>
        <h2 className={styles.title}>Editar organização</h2>
        <TextField
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          required
        />
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
