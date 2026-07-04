import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Organization } from '../domain/organization.entity';
import {
  CreateOrganizationData,
  OrganizationRepository,
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

  async findByUserId(userId: string): Promise<Organization[]> {
    const rows = await this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
    });
    return rows.map((row) => this.toDomain(row));
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
