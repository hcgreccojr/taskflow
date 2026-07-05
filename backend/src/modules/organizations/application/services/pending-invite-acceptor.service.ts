import { Inject, Injectable } from '@nestjs/common';
import { MembershipRepository, MEMBERSHIP_REPOSITORY } from '../ports/membership-repository.port';
import {
  PendingInviteRepository,
  PENDING_INVITE_REPOSITORY,
} from '../ports/pending-invite-repository.port';

@Injectable()
export class PendingInviteAcceptorService {
  constructor(
    @Inject(PENDING_INVITE_REPOSITORY)
    private readonly pendingInviteRepository: PendingInviteRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  /** Converte todo convite pendente para este e-mail em Membership real. */
  async acceptPendingInvites(userId: string, email: string): Promise<void> {
    const invites = await this.pendingInviteRepository.findByEmail(email);

    for (const invite of invites) {
      await this.membershipRepository.create({
        userId,
        organizationId: invite.organizationId,
        role: invite.role,
      });
      await this.pendingInviteRepository.delete(invite.id);
    }
  }
}
