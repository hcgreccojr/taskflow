import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../../users/application/ports/user-repository.port';
import { Membership, MembershipRole } from '../../domain/membership.entity';
import { PendingInvite } from '../../domain/pending-invite.entity';
import {
  MembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../ports/membership-repository.port';
import {
  PendingInviteRepository,
  PENDING_INVITE_REPOSITORY,
} from '../ports/pending-invite-repository.port';
import { MembershipCheckerService } from '../services/membership-checker.service';

export interface InviteMemberInput {
  requesterId: string;
  organizationId: string;
  email: string;
  role?: MembershipRole;
}

export type InviteMemberResult =
  | { status: 'joined'; membership: Membership }
  | { status: 'pending'; invite: PendingInvite };

@Injectable()
export class InviteMemberUseCase {
  constructor(
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    @Inject(PENDING_INVITE_REPOSITORY)
    private readonly pendingInviteRepository: PendingInviteRepository,
  ) {}

  async execute(input: InviteMemberInput): Promise<InviteMemberResult> {
    await this.membershipChecker.assertAdmin(input.requesterId, input.organizationId);

    const role = input.role ?? MembershipRole.MEMBER;
    const invitedUser = await this.userRepository.findByEmail(input.email);

    if (!invitedUser) {
      const invite = await this.pendingInviteRepository.upsert({
        organizationId: input.organizationId,
        email: input.email,
        role,
      });
      return { status: 'pending', invite };
    }

    const existingMembership = await this.membershipRepository.findByUserAndOrganization(
      invitedUser.id,
      input.organizationId,
    );
    if (existingMembership) {
      throw new ConflictException('Usuário já é membro desta organização');
    }

    const membership = await this.membershipRepository.create({
      userId: invitedUser.id,
      organizationId: input.organizationId,
      role,
    });
    return { status: 'joined', membership };
  }
}
