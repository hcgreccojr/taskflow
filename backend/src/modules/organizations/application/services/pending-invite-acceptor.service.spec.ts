import { PendingInviteAcceptorService } from './pending-invite-acceptor.service';
import { PendingInvite } from '../../domain/pending-invite.entity';
import { MembershipRole } from '../../domain/membership.entity';

describe('PendingInviteAcceptorService', () => {
  let service: PendingInviteAcceptorService;
  let pendingInviteRepository: { findByEmail: jest.Mock; delete: jest.Mock };
  let membershipRepository: { create: jest.Mock };

  beforeEach(() => {
    pendingInviteRepository = { findByEmail: jest.fn(), delete: jest.fn() };
    membershipRepository = { create: jest.fn() };
    service = new PendingInviteAcceptorService(
      pendingInviteRepository as any,
      membershipRepository as any,
    );
  });

  it('does nothing when there are no pending invites for the e-mail', async () => {
    pendingInviteRepository.findByEmail.mockResolvedValue([]);

    await service.acceptPendingInvites('user-1', 'ana@example.com');

    expect(membershipRepository.create).not.toHaveBeenCalled();
    expect(pendingInviteRepository.delete).not.toHaveBeenCalled();
  });

  it('creates a membership and deletes the pending invite for each match', async () => {
    const invites = [
      new PendingInvite('inv-1', 'org-1', 'ana@example.com', MembershipRole.MEMBER, new Date()),
      new PendingInvite('inv-2', 'org-2', 'ana@example.com', MembershipRole.ADMIN, new Date()),
    ];
    pendingInviteRepository.findByEmail.mockResolvedValue(invites);

    await service.acceptPendingInvites('user-1', 'ana@example.com');

    expect(membershipRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-1',
      role: MembershipRole.MEMBER,
    });
    expect(membershipRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-2',
      role: MembershipRole.ADMIN,
    });
    expect(pendingInviteRepository.delete).toHaveBeenCalledWith('inv-1');
    expect(pendingInviteRepository.delete).toHaveBeenCalledWith('inv-2');
  });
});
