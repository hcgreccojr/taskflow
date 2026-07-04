import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Membership, MembershipRole } from '../../domain/membership.entity';
import { MembershipRepository, MEMBERSHIP_REPOSITORY } from '../ports/membership-repository.port';

@Injectable()
export class MembershipCheckerService {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepository: MembershipRepository,
  ) {}

  async assertMember(userId: string, organizationId: string): Promise<Membership> {
    const membership = await this.membershipRepository.findByUserAndOrganization(
      userId,
      organizationId,
    );
    if (!membership) {
      throw new ForbiddenException('Você não é membro desta organização');
    }
    return membership;
  }

  async assertAdmin(userId: string, organizationId: string): Promise<Membership> {
    const membership = await this.assertMember(userId, organizationId);
    if (membership.role !== MembershipRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem realizar esta ação');
    }
    return membership;
  }
}
