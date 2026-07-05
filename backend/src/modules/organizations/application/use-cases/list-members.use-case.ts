import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../../users/application/ports/user-repository.port';
import { User } from '../../../users/domain/user.entity';
import { Membership } from '../../domain/membership.entity';
import { MembershipRepository, MEMBERSHIP_REPOSITORY } from '../ports/membership-repository.port';
import { MembershipCheckerService } from '../services/membership-checker.service';

export interface ListMembersInput {
  requesterId: string;
  organizationId: string;
}

export interface MemberWithUser {
  membership: Membership;
  user: User;
}

@Injectable()
export class ListMembersUseCase {
  constructor(
    private readonly membershipChecker: MembershipCheckerService,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListMembersInput): Promise<MemberWithUser[]> {
    await this.membershipChecker.assertMember(input.requesterId, input.organizationId);

    const memberships = await this.membershipRepository.findByOrganization(input.organizationId);

    const results: MemberWithUser[] = [];
    for (const membership of memberships) {
      const user = await this.userRepository.findById(membership.userId);
      if (user) {
        results.push({ membership, user });
      }
    }
    return results;
  }
}
