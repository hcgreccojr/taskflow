import { Organization } from '../../domain/organization.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface CreateOrganizationData {
  name: string;
  ownerId: string;
}

export interface OrganizationRepository {
  /** Cria a organização e a Membership ADMIN do dono numa única transação (RF-004). */
  createWithOwnerMembership(data: CreateOrganizationData): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findByUserId(userId: string): Promise<Organization[]>;
}
