import { Inject, Injectable } from '@nestjs/common';
import {
  OrganizationRepository,
  OrganizationWithRole,
  ORGANIZATION_REPOSITORY,
} from '../ports/organization-repository.port';

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(userId: string): Promise<OrganizationWithRole[]> {
    return this.organizationRepository.findByUserId(userId);
  }
}
