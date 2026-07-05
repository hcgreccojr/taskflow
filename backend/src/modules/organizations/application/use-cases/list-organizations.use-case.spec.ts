import { ListOrganizationsUseCase } from './list-organizations.use-case';
import { Organization } from '../../domain/organization.entity';

describe('ListOrganizationsUseCase', () => {
  let useCase: ListOrganizationsUseCase;
  let organizationRepository: { findByUserId: jest.Mock };

  beforeEach(() => {
    organizationRepository = { findByUserId: jest.fn() };
    useCase = new ListOrganizationsUseCase(organizationRepository as any);
  });

  it('returns the organizations the user belongs to', async () => {
    const organizations = [new Organization('org-1', 'Acme', 'user-1', new Date())];
    organizationRepository.findByUserId.mockResolvedValue(organizations);

    const result = await useCase.execute('user-1');

    expect(organizationRepository.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toBe(organizations);
  });

  it('returns an empty array when the user has no organizations', async () => {
    organizationRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
  });
});
