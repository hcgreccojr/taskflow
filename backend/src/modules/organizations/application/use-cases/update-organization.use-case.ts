import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { OrganizationRepository, ORGANIZATION_REPOSITORY } from '../ports/organization-repository.port';

export interface UpdateOrganizationInput {
  requesterId: string;
  organizationId: string;
  name?: string;
}

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizationRepository: OrganizationRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: UpdateOrganizationInput): Promise<Organization> {
    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    await this.membershipChecker.assertMember(input.requesterId, input.organizationId);

    return this.organizationRepository.update(input.organizationId, { name: input.name });
  }
}
