import { Inject, Injectable } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import {
  OrganizationRepository,
  ORGANIZATION_REPOSITORY,
} from '../ports/organization-repository.port';

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(userId: string): Promise<Organization[]> {
    return this.organizationRepository.findByUserId(userId);
  }
}
