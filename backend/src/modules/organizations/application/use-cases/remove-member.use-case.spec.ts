import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { Membership, MembershipRole } from '../../domain/membership.entity';

describe('RemoveMemberUseCase', () => {
  let useCase: RemoveMemberUseCase;
  let membershipRepository: { findById: jest.Mock; delete: jest.Mock };
  let membershipChecker: { assertAdmin: jest.Mock };

  beforeEach(() => {
    membershipRepository = { findById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    membershipChecker = { assertAdmin: jest.fn().mockResolvedValue(undefined) };
    useCase = new RemoveMemberUseCase(
      membershipRepository as any,
      membershipChecker as unknown as MembershipCheckerService,
    );
  });

  const input = { requesterId: 'admin-1', organizationId: 'org-1', membershipId: 'mem-2' };

  it('propagates ForbiddenException when the requester is not an admin', async () => {
    membershipChecker.assertAdmin.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(membershipRepository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the membership does not exist', async () => {
    membershipRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when the membership belongs to a different organization', async () => {
    membershipRepository.findById.mockResolvedValue(
      new Membership('mem-2', 'user-2', 'org-other', MembershipRole.MEMBER),
    );

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(membershipRepository.delete).not.toHaveBeenCalled();
  });

  it('removes the membership when the requester is an admin and the membership belongs to the organization', async () => {
    membershipRepository.findById.mockResolvedValue(
      new Membership('mem-2', 'user-2', 'org-1', MembershipRole.MEMBER),
    );

    await useCase.execute(input);

    expect(membershipRepository.delete).toHaveBeenCalledWith('mem-2');
  });
});
