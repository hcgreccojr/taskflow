import { ConflictException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../../users/application/ports/user-repository.port';
import { Membership, MembershipRole } from '../../domain/membership.entity';
import {
  MembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../ports/membership-repository.port';
import { MembershipCheckerService } from '../services/membership-checker.service';

export interface InviteMemberInput {
  requesterId: string;
  organizationId: string;
  email: string;
  role?: MembershipRole;
}

@Injectable()
export class InviteMemberUseCase {
  constructor(
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(input: InviteMemberInput): Promise<Membership> {
    await this.membershipChecker.assertAdmin(input.requesterId, input.organizationId);

    const invitedUser = await this.userRepository.findByEmail(input.email);
    if (!invitedUser) {
      throw new UnprocessableEntityException(
        'Não existe usuário cadastrado com este e-mail',
      );
    }

    const existingMembership = await this.membershipRepository.findByUserAndOrganization(
      invitedUser.id,
      input.organizationId,
    );
    if (existingMembership) {
      throw new ConflictException('Usuário já é membro desta organização');
    }

    return this.membershipRepository.create({
      userId: invitedUser.id,
      organizationId: input.organizationId,
      role: input.role ?? MembershipRole.MEMBER,
    });
  }
}
