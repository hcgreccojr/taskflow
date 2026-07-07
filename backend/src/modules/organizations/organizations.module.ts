import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ORGANIZATION_REPOSITORY } from './application/ports/organization-repository.port';
import { MEMBERSHIP_REPOSITORY } from './application/ports/membership-repository.port';
import { PENDING_INVITE_REPOSITORY } from './application/ports/pending-invite-repository.port';
import { PrismaOrganizationRepository } from './infrastructure/prisma-organization.repository';
import { PrismaMembershipRepository } from './infrastructure/prisma-membership.repository';
import { PrismaPendingInviteRepository } from './infrastructure/prisma-pending-invite.repository';
import { MembershipCheckerService } from './application/services/membership-checker.service';
import { PendingInviteAcceptorService } from './application/services/pending-invite-acceptor.service';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { ListOrganizationsUseCase } from './application/use-cases/list-organizations.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case';
import { DeleteOrganizationUseCase } from './application/use-cases/delete-organization.use-case';
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case';
import { ListMembersUseCase } from './application/use-cases/list-members.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { OrganizationsController } from './presentation/organizations.controller';

@Module({
  imports: [UsersModule],
  controllers: [OrganizationsController],
  providers: [
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    { provide: PENDING_INVITE_REPOSITORY, useClass: PrismaPendingInviteRepository },
    MembershipCheckerService,
    PendingInviteAcceptorService,
    CreateOrganizationUseCase,
    ListOrganizationsUseCase,
    UpdateOrganizationUseCase,
    DeleteOrganizationUseCase,
    InviteMemberUseCase,
    ListMembersUseCase,
    RemoveMemberUseCase,
  ],
  exports: [
    MembershipCheckerService,
    PendingInviteAcceptorService,
    ORGANIZATION_REPOSITORY,
    MEMBERSHIP_REPOSITORY,
  ],
})
export class OrganizationsModule {}
