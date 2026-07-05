import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../shared/components/Button';
import styles from './InlineTaskComposer.module.css';

interface InlineTaskComposerProps {
  onCreate: (title: string) => Promise<void>;
}

export function InlineTaskComposer({ onCreate }: InlineTaskComposerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(text.trim());
      setText('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        + Adicionar tarefa
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Título da tarefa"
        autoFocus
      />
      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>
          Adicionar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
