import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteOrganizationUseCase } from './delete-organization.use-case';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { Organization } from '../../domain/organization.entity';

describe('DeleteOrganizationUseCase', () => {
  let useCase: DeleteOrganizationUseCase;
  let organizationRepository: { findById: jest.Mock; delete: jest.Mock };
  let membershipChecker: { assertAdmin: jest.Mock };

  beforeEach(() => {
    organizationRepository = { findById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    membershipChecker = { assertAdmin: jest.fn() };
    useCase = new DeleteOrganizationUseCase(
      organizationRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  const input = { requesterId: 'user-1', organizationId: 'org-1' };

  it('throws NotFoundException when the organization does not exist', async () => {
    organizationRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipChecker.assertAdmin).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not an admin', async () => {
    organizationRepository.findById.mockResolvedValue(
      new Organization('org-1', 'Acme Corp', 'owner-1', new Date()),
    );
    membershipChecker.assertAdmin.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(organizationRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the organization when the requester is an admin', async () => {
    organizationRepository.findById.mockResolvedValue(
      new Organization('org-1', 'Acme Corp', 'owner-1', new Date()),
    );
    membershipChecker.assertAdmin.mockResolvedValue(undefined);

    await useCase.execute(input);

    expect(organizationRepository.delete).toHaveBeenCalledWith('org-1');
  });
});
