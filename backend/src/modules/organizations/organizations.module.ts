import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ORGANIZATION_REPOSITORY } from './application/ports/organization-repository.port';
import { MEMBERSHIP_REPOSITORY } from './application/ports/membership-repository.port';
import { PrismaOrganizationRepository } from './infrastructure/prisma-organization.repository';
import { PrismaMembershipRepository } from './infrastructure/prisma-membership.repository';
import { MembershipCheckerService } from './application/services/membership-checker.service';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { ListOrganizationsUseCase } from './application/use-cases/list-organizations.use-case';
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case';
import { OrganizationsController } from './presentation/organizations.controller';

@Module({
  imports: [UsersModule],
  controllers: [OrganizationsController],
  providers: [
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    MembershipCheckerService,
    CreateOrganizationUseCase,
    ListOrganizationsUseCase,
    InviteMemberUseCase,
  ],
  exports: [MembershipCheckerService, ORGANIZATION_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class OrganizationsModule {}
