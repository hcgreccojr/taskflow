import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole } from '../../domain/membership.entity';
import { MembershipRepository, MEMBERSHIP_REPOSITORY } from '../ports/membership-repository.port';
import { MembershipCheckerService } from '../services/membership-checker.service';

export interface RemoveMemberInput {
  requesterId: string;
  organizationId: string;
  membershipId: string;
}

/** RN-002: apenas administradores da organização podem remover membros. */
@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: RemoveMemberInput): Promise<void> {
    await this.membershipChecker.assertAdmin(input.requesterId, input.organizationId);

    const membership = await this.membershipRepository.findById(input.membershipId);
    if (!membership || membership.organizationId !== input.organizationId) {
      throw new NotFoundException('Membro não encontrado nesta organização');
    }

    if (membership.role === MembershipRole.ADMIN) {
      const allMembers = await this.membershipRepository.findByOrganization(input.organizationId);
      const adminCount = allMembers.filter((member) => member.role === MembershipRole.ADMIN).length;
      if (adminCount <= 1) {
        throw new BadRequestException('A organização precisa ter pelo menos um administrador');
      }
    }

    await this.membershipRepository.delete(membership.id);
  }
}
