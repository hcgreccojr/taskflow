import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Organization } from '../domain/organization.entity';
import { MembershipRole } from '../domain/membership.entity';
import {
  CreateOrganizationData,
  OrganizationRepository,
  OrganizationWithRole,
  UpdateOrganizationData,
} from '../application/ports/organization-repository.port';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwnerMembership(data: CreateOrganizationData): Promise<Organization> {
    const row = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: data.name, ownerId: data.ownerId },
      });
      await tx.membership.create({
        data: {
          userId: data.ownerId,
          organizationId: organization.id,
          role: Role.ADMIN,
        },
      });
      return organization;
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<OrganizationWithRole[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((membership) => ({
      organization: this.toDomain(membership.organization),
      role: membership.role as unknown as MembershipRole,
    }));
  }

  async update(id: string, data: UpdateOrganizationData): Promise<Organization> {
    const row = await this.prisma.organization.update({
      where: { id },
      data: { name: data.name },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.task.deleteMany({ where: { column: { board: { organizationId: id } } } }),
      this.prisma.column.deleteMany({ where: { board: { organizationId: id } } }),
      this.prisma.board.deleteMany({ where: { organizationId: id } }),
      this.prisma.membership.deleteMany({ where: { organizationId: id } }),
      this.prisma.pendingInvite.deleteMany({ where: { organizationId: id } }),
      this.prisma.organization.delete({ where: { id } }),
    ]);
  }

  private toDomain(row: {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
  }): Organization {
    return new Organization(row.id, row.name, row.ownerId, row.createdAt);
  }
}
