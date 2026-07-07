export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type MembershipRole = 'ADMIN' | 'MEMBER';

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  /** Papel do usuário atual nesta organização. Presente em list/create; ausente em update. */
  role?: MembershipRole;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
}

/** GET /organizations/:id/members — membership + dados do usuário já combinados pelo backend. */
export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  name: string;
  email: string;
}

export interface PendingInvite {
  id: string;
  organizationId: string;
  email: string;
  role: MembershipRole;
  createdAt: string;
}

/**
 * POST /organizations/:id/invites — "joined" quando o e-mail já tinha conta (virou membro
 * na hora); "pending" quando não tinha (vira membro automaticamente ao se cadastrar).
 */
export type InviteResult =
  | { status: 'joined'; membership: Membership }
  | { status: 'pending'; invite: PendingInvite };

export interface Board {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  order: number;
  priority: TaskPriority;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
