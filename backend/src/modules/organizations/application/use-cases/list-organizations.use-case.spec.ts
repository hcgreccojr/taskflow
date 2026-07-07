import { ListOrganizationsUseCase } from './list-organizations.use-case';
import { Organization } from '../../domain/organization.entity';
import { MembershipRole } from '../../domain/membership.entity';

describe('ListOrganizationsUseCase', () => {
  let useCase: ListOrganizationsUseCase;
  let organizationRepository: { findByUserId: jest.Mock };

  beforeEach(() => {
    organizationRepository = { findByUserId: jest.fn() };
    useCase = new ListOrganizationsUseCase(organizationRepository as any);
  });

  it('returns the organizations the user belongs to, with their role in each', async () => {
    const organizations = [
      { organization: new Organization('org-1', 'Acme', 'user-1', new Date()), role: MembershipRole.ADMIN },
    ];
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
