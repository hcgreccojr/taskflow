import { ConflictException, ForbiddenException } from '@nestjs/common';
import { InviteMemberUseCase } from './invite-member.use-case';
import { MembershipCheckerService } from '../services/membership-checker.service';
import { Membership, MembershipRole } from '../../domain/membership.entity';
import { PendingInvite } from '../../domain/pending-invite.entity';
import { User } from '../../../users/domain/user.entity';

describe('InviteMemberUseCase', () => {
  let useCase: InviteMemberUseCase;
  let membershipChecker: { assertAdmin: jest.Mock };
  let userRepository: { findByEmail: jest.Mock };
  let membershipRepository: { findByUserAndOrganization: jest.Mock; create: jest.Mock };
  let pendingInviteRepository: { upsert: jest.Mock };

  beforeEach(() => {
    membershipChecker = { assertAdmin: jest.fn() };
    userRepository = { findByEmail: jest.fn() };
    membershipRepository = { findByUserAndOrganization: jest.fn(), create: jest.fn() };
    pendingInviteRepository = { upsert: jest.fn() };
    useCase = new InviteMemberUseCase(
      membershipChecker as unknown as MembershipCheckerService,
      userRepository as any,
      membershipRepository as any,
      pendingInviteRepository as any,
    );
  });

  const input = { requesterId: 'admin-1', organizationId: 'org-1', email: 'colega@example.com' };

  it('propagates ForbiddenException when the requester is not an admin', async () => {
    membershipChecker.assertAdmin.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('creates a pending invite (instead of failing) when no user has that e-mail', async () => {
    membershipChecker.assertAdmin.mockResolvedValue(undefined);
    userRepository.findByEmail.mockResolvedValue(null);
    const invite = new PendingInvite('inv-1', 'org-1', 'colega@example.com', MembershipRole.MEMBER, new Date());
    pendingInviteRepository.upsert.mockResolvedValue(invite);

    const result = await useCase.execute(input);

    expect(pendingInviteRepository.upsert).toHaveBeenCalledWith({
      organizationId: 'org-1',
      email: 'colega@example.com',
      role: MembershipRole.MEMBER,
    });
    expect(result).toEqual({ status: 'pending', invite });
    expect(membershipRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the user is already a member', async () => {
    membershipChecker.assertAdmin.mockResolvedValue(undefined);
    userRepository.findByEmail.mockResolvedValue(
      new User('user-2', 'Colega', 'colega@example.com', 'hash', new Date()),
    );
    membershipRepository.findByUserAndOrganization.mockResolvedValue(
      new Membership('m1', 'user-2', 'org-1', MembershipRole.MEMBER),
    );

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictException);
    expect(membershipRepository.create).not.toHaveBeenCalled();
  });

  it('creates a MEMBER membership by default when everything is valid', async () => {
    membershipChecker.assertAdmin.mockResolvedValue(undefined);
    userRepository.findByEmail.mockResolvedValue(
      new User('user-2', 'Colega', 'colega@example.com', 'hash', new Date()),
    );
    membershipRepository.findByUserAndOrganization.mockResolvedValue(null);
    const created = new Membership('m1', 'user-2', 'org-1', MembershipRole.MEMBER);
    membershipRepository.create.mockResolvedValue(created);

    const result = await useCase.execute(input);

    expect(membershipRepository.create).toHaveBeenCalledWith({
      userId: 'user-2',
      organizationId: 'org-1',
      role: MembershipRole.MEMBER,
    });
    expect(result).toEqual({ status: 'joined', membership: created });
  });
});
