import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import type { Board } from '../../../shared/types/api';
import styles from './EditBoardModal.module.css';

interface EditBoardModalProps {
  board: Board;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
  onClose: () => void;
}

export function EditBoardModal({ board, onSave, onClose }: EditBoardModalProps) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <form className={styles.content} onSubmit={onSubmit}>
        <h2 className={styles.title}>Editar quadro</h2>
        <TextField
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          required
        />
        <TextField
          label="Descrição"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
