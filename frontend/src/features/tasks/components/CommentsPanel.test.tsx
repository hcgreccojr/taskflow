import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommentsPanel } from './CommentsPanel';
import * as commentsApi from '../../../services/commentsApi';
import type { Comment, Member } from '../../../shared/types/api';

vi.mock('../../../services/commentsApi');

const members = new Map<string, Member>([
  ['user-1', { id: 'm1', userId: 'user-1', organizationId: 'org-1', role: 'MEMBER', name: 'Ana', email: 'a@e.com' }],
  ['user-2', { id: 'm2', userId: 'user-2', organizationId: 'org-1', role: 'MEMBER', name: 'Bruno', email: 'b@e.com' }],
]);

function comment(overrides: Partial<Comment>): Comment {
  return {
    id: 'c1',
    taskId: 'task-1',
    authorId: 'user-1',
    content: 'Olá',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('CommentsPanel', () => {
  it('shows Editar and Excluir for the author within the 15-minute window', async () => {
    vi.mocked(commentsApi.listComments).mockResolvedValue([comment({ authorId: 'user-1' })]);

    render(<CommentsPanel taskId="task-1" currentUserId="user-1" membersById={members} />);

    expect(await screen.findByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('hides Editar (but keeps Excluir) once the 15-minute window has passed', async () => {
    const old = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    vi.mocked(commentsApi.listComments).mockResolvedValue([comment({ authorId: 'user-1', createdAt: old })]);

    render(<CommentsPanel taskId="task-1" currentUserId="user-1" membersById={members} />);

    expect(await screen.findByText('Excluir')).toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('shows no author actions for a comment written by someone else', async () => {
    vi.mocked(commentsApi.listComments).mockResolvedValue([comment({ authorId: 'user-2' })]);

    render(<CommentsPanel taskId="task-1" currentUserId="user-1" membersById={members} />);

    expect(await screen.findByText('Olá')).toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument();
  });
});
