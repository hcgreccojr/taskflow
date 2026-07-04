import { Inject, Injectable } from '@nestjs/common';
import { Organization } from '../../domain/organization.entity';
import {
  OrganizationRepository,
  ORGANIZATION_REPOSITORY,
} from '../ports/organization-repository.port';

export interface CreateOrganizationInput {
  name: string;
  ownerId: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(input: CreateOrganizationInput): Promise<Organization> {
    return this.organizationRepository.createWithOwnerMembership(input);
  }
}
