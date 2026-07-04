import { ForbiddenException } from '@nestjs/common';
import { MembershipCheckerService } from './membership-checker.service';
import { Membership, MembershipRole } from '../../domain/membership.entity';

describe('MembershipCheckerService', () => {
  let service: MembershipCheckerService;
  let membershipRepository: { findByUserAndOrganization: jest.Mock };

  beforeEach(() => {
    membershipRepository = { findByUserAndOrganization: jest.fn() };
    service = new MembershipCheckerService(membershipRepository as any);
  });

  describe('assertMember', () => {
    it('throws ForbiddenException when the user is not a member', async () => {
      membershipRepository.findByUserAndOrganization.mockResolvedValue(null);

      await expect(service.assertMember('user-1', 'org-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns the membership when the user is a member', async () => {
      const membership = new Membership('m1', 'user-1', 'org-1', MembershipRole.MEMBER);
      membershipRepository.findByUserAndOrganization.mockResolvedValue(membership);

      await expect(service.assertMember('user-1', 'org-1')).resolves.toBe(membership);
    });
  });

  describe('assertAdmin', () => {
    it('throws ForbiddenException when the member is not an admin', async () => {
      membershipRepository.findByUserAndOrganization.mockResolvedValue(
        new Membership('m1', 'user-1', 'org-1', MembershipRole.MEMBER),
      );

      await expect(service.assertAdmin('user-1', 'org-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns the membership when the member is an admin', async () => {
      const membership = new Membership('m1', 'user-1', 'org-1', MembershipRole.ADMIN);
      membershipRepository.findByUserAndOrganization.mockResolvedValue(membership);

      await expect(service.assertAdmin('user-1', 'org-1')).resolves.toBe(membership);
    });
  });
});
