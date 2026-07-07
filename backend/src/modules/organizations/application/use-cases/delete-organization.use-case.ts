import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { OrganizationRepository, ORGANIZATION_REPOSITORY } from '../ports/organization-repository.port';

export interface DeleteOrganizationInput {
  requesterId: string;
  organizationId: string;
}

/** Exclusão de organização é destrutiva (apaga boards, colunas, tarefas, memberships e convites em cascata) — exige ADMIN. */
@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizationRepository: OrganizationRepository,
    private readonly membershipChecker: MembershipCheckerService,
  ) {}

  async execute(input: DeleteOrganizationInput): Promise<void> {
    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    await this.membershipChecker.assertAdmin(input.requesterId, input.organizationId);

    await this.organizationRepository.delete(input.organizationId);
  }
}
