import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MembershipRole } from '../domain/membership.entity';
import { PendingInvite } from '../domain/pending-invite.entity';
import {
  PendingInviteRepository,
  UpsertPendingInviteData,
} from '../application/ports/pending-invite-repository.port';

@Injectable()
export class PrismaPendingInviteRepository implements PendingInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertPendingInviteData): Promise<PendingInvite> {
    const row = await this.prisma.pendingInvite.upsert({
      where: { organizationId_email: { organizationId: data.organizationId, email: data.email } },
      create: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role as unknown as Role,
      },
      update: { role: data.role as unknown as Role },
    });
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<PendingInvite[]> {
    const rows = await this.prisma.pendingInvite.findMany({ where: { email } });
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pendingInvite.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    organizationId: string;
    email: string;
    role: Role;
    createdAt: Date;
  }): PendingInvite {
    return new PendingInvite(
      row.id,
      row.organizationId,
      row.email,
      row.role as unknown as MembershipRole,
      row.createdAt,
    );
  }
}
