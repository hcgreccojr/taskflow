import { CreateOrganizationUseCase } from './create-organization.use-case';
import { Organization } from '../../domain/organization.entity';

describe('CreateOrganizationUseCase', () => {
  it('delegates to the repository to create the organization with the owner membership', async () => {
    const created = new Organization('org-1', 'Minha Empresa', 'user-1', new Date());
    const organizationRepository = {
      createWithOwnerMembership: jest.fn().mockResolvedValue(created),
    };
    const useCase = new CreateOrganizationUseCase(organizationRepository as any);

    const result = await useCase.execute({ name: 'Minha Empresa', ownerId: 'user-1' });

    expect(organizationRepository.createWithOwnerMembership).toHaveBeenCalledWith({
      name: 'Minha Empresa',
      ownerId: 'user-1',
    });
    expect(result).toBe(created);
  });
});
