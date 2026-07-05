import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import * as commentsApi from '../../../services/commentsApi';
import { ApiError } from '../../../services/httpClient';
import type { Comment, Member } from '../../../shared/types/api';
import { Avatar } from '../../../shared/components/Avatar';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { relativeTime } from '../utils/relativeTime';
import styles from './CommentsPanel.module.css';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

interface CommentsPanelProps {
  taskId: string;
  currentUserId: string;
  membersById: Map<string, Member>;
}

function canStillEdit(comment: Comment): boolean {
  return Date.now() - new Date(comment.createdAt).getTime() <= EDIT_WINDOW_MS;
}

export function CommentsPanel({ taskId, currentUserId, membersById }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commentsApi.listComments(taskId).then(setComments);
  }, [taskId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!newText.trim()) return;
    const comment = await commentsApi.createComment(taskId, newText.trim());
    setComments((prev) => [...prev, comment]);
    setNewText('');
  }

  async function onSaveEdit(commentId: string) {
    setError(null);
    try {
      const updated = await commentsApi.updateComment(commentId, editingText.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível editar o comentário.');
    }
  }

  async function onDelete(commentId: string) {
    await commentsApi.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div>
      <form className={styles.composer} onSubmit={onSubmit}>
        <Avatar name={membersById.get(currentUserId)?.name} size={28} />
        <div className={styles.composerBody}>
          <textarea
            className={styles.textarea}
            placeholder="Escreva um comentário..."
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
          />
          <Button type="submit" style={{ alignSelf: 'flex-start' }}>
            Comentar
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState title="Nenhum comentário ainda." />
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => {
            const author = membersById.get(comment.authorId);
            const isAuthor = comment.authorId === currentUserId;
            const editable = isAuthor && canStillEdit(comment);
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className={styles.item}>
                <Avatar name={author?.name} size={28} />
                <div className={styles.itemBody}>
                  <div className={styles.itemHeader}>
                    <span className={styles.author}>{author?.name ?? 'Usuário'}</span>
                    <span className={styles.time}>{relativeTime(comment.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className={styles.editArea}>
                      <textarea
                        className={styles.textarea}
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                      />
                      <div className={styles.itemActions}>
                        <button type="button" className={styles.linkButton} onClick={() => onSaveEdit(comment.id)}>
                          Salvar
                        </button>
                        <button type="button" className={styles.linkButton} onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={styles.text}>{comment.content}</p>
                      {isAuthor && (
                        <div className={styles.itemActions}>
                          {editable && (
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditingText(comment.content);
                              }}
                            >
                              Editar
                            </button>
                          )}
                          <button type="button" className={styles.linkButton} onClick={() => onDelete(comment.id)}>
                            Excluir
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {error && <p className={styles.time}>{error}</p>}
    </div>
  );
}
