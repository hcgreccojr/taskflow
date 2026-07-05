import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Membership, MembershipRole } from '../domain/membership.entity';
import {
  CreateMembershipData,
  MembershipRepository,
} from '../application/ports/membership-repository.port';

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null> {
    const row = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<Membership[]> {
    const rows = await this.prisma.membership.findMany({ where: { organizationId } });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateMembershipData): Promise<Membership> {
    const row = await this.prisma.membership.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role as unknown as Role,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.membership.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
  }): Membership {
    return new Membership(row.id, row.userId, row.organizationId, row.role as unknown as MembershipRole);
  }
}
