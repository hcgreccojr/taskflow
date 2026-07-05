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
