import { ForbiddenException } from '@nestjs/common';
import { ListMembersUseCase } from './list-members.use-case';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { Membership, MembershipRole } from '../../domain/membership.entity';
import { User } from '../../../users/domain/user.entity';

describe('ListMembersUseCase', () => {
  let useCase: ListMembersUseCase;
  let membershipChecker: { assertMember: jest.Mock };
  let membershipRepository: { findByOrganization: jest.Mock };
  let userRepository: { findById: jest.Mock };

  beforeEach(() => {
    membershipChecker = { assertMember: jest.fn() };
    membershipRepository = { findByOrganization: jest.fn() };
    userRepository = { findById: jest.fn() };
    useCase = new ListMembersUseCase(
      membershipChecker as unknown as MembershipCheckerService,
      membershipRepository as any,
      userRepository as any,
    );
  });

  const input = { requesterId: 'user-1', organizationId: 'org-1' };

  it('propagates ForbiddenException when the requester is not a member', async () => {
    membershipChecker.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(membershipRepository.findByOrganization).not.toHaveBeenCalled();
  });

  it('combines each membership with its user', async () => {
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const membership1 = new Membership('m1', 'user-1', 'org-1', MembershipRole.ADMIN);
    const membership2 = new Membership('m2', 'user-2', 'org-1', MembershipRole.MEMBER);
    membershipRepository.findByOrganization.mockResolvedValue([membership1, membership2]);
    const user1 = new User('user-1', 'Ana', 'ana@example.com', 'hash', new Date());
    const user2 = new User('user-2', 'Bruno', 'bruno@example.com', 'hash', new Date());
    userRepository.findById.mockImplementation((id: string) =>
      Promise.resolve(id === 'user-1' ? user1 : user2),
    );

    const result = await useCase.execute(input);

    expect(result).toEqual([
      { membership: membership1, user: user1 },
      { membership: membership2, user: user2 },
    ]);
  });

  it('skips memberships whose user can no longer be found', async () => {
    membershipChecker.assertMember.mockResolvedValue(undefined);
    const membership1 = new Membership('m1', 'user-1', 'org-1', MembershipRole.ADMIN);
    membershipRepository.findByOrganization.mockResolvedValue([membership1]);
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result).toEqual([]);
  });
});
