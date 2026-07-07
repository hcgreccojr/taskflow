import { Organization } from '../../domain/organization.entity';
import { MembershipRole } from '../../domain/membership.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface CreateOrganizationData {
  name: string;
  ownerId: string;
}

export interface UpdateOrganizationData {
  name?: string;
}

export interface OrganizationWithRole {
  organization: Organization;
  role: MembershipRole;
}

export interface OrganizationRepository {
  /** Cria a organização e a Membership ADMIN do dono numa única transação (RF-004). */
  createWithOwnerMembership(data: CreateOrganizationData): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  /** Inclui o papel (role) do próprio usuário em cada organização, usado pela UI para exibir ações de editar/excluir. */
  findByUserId(userId: string): Promise<OrganizationWithRole[]>;
  update(id: string, data: UpdateOrganizationData): Promise<Organization>;
  /** Apaga a organização e, em cascata (aplicação, não FK), boards, colunas, tarefas, memberships e convites. */
  delete(id: string): Promise<void>;
}
