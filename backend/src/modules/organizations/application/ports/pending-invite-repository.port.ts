import { MembershipRole } from '../../domain/membership.entity';
import { PendingInvite } from '../../domain/pending-invite.entity';

export const PENDING_INVITE_REPOSITORY = Symbol('PENDING_INVITE_REPOSITORY');

export interface UpsertPendingInviteData {
  organizationId: string;
  email: string;
  role: MembershipRole;
}

export interface PendingInviteRepository {
  /** Cria ou atualiza (mesma organização+e-mail) o convite pendente. */
  upsert(data: UpsertPendingInviteData): Promise<PendingInvite>;
  findByEmail(email: string): Promise<PendingInvite[]>;
  delete(id: string): Promise<void>;
}
