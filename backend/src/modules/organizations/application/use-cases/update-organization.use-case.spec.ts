import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateOrganizationUseCase } from './update-organization.use-case';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { Organization } from '../../domain/organization.entity';

describe('UpdateOrganizationUseCase', () => {
  let useCase: UpdateOrganizationUseCase;
  let organizationRepository: { findById: jest.Mock; update: jest.Mock };
  let membershipChecker: { assertMember: jest.Mock };

  beforeEach(() => {
    organizationRepository = { findById: jest.fn(), update: jest.fn() };
    membershipChecker = { assertMember: jest.fn() };
    useCase = new UpdateOrganizationUseCase(
      organizationRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  const input = { requesterId: 'user-1', organizationId: 'org-1', name: 'Acme Corp' };

  it('throws NotFoundException when the organization does not exist', async () => {
    organizationRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipChecker.assertMember).not.toHaveBeenCalled();
  });

  it('propagates ForbiddenException when the requester is not a member', async () => {
    organizationRepository.findById.mockResolvedValue(
      new Organization('org-1', 'Old Name', 'owner-1', new Date()),
    );
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(organizationRepository.update).not.toHaveBeenCalled();
  });

  it('updates the organization when the requester is a member', async () => {
    organizationRepository.findById.mockResolvedValue(
      new Organization('org-1', 'Old Name', 'owner-1', new Date()),
    );
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const updated = new Organization('org-1', 'Acme Corp', 'owner-1', new Date());
    organizationRepository.update.mockResolvedValue(updated);

    const result = await useCase.execute(input);

    expect(organizationRepository.update).toHaveBeenCalledWith('org-1', { name: 'Acme Corp' });
    expect(result).toBe(updated);
  });
});
