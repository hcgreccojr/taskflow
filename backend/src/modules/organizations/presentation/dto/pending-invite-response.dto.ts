import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '../../domain/membership.entity';
import { PendingInvite } from '../../domain/pending-invite.entity';

export class PendingInviteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: MembershipRole })
  role!: MembershipRole;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(invite: PendingInvite): PendingInviteResponseDto {
    const dto = new PendingInviteResponseDto();
    dto.id = invite.id;
    dto.organizationId = invite.organizationId;
    dto.email = invite.email;
    dto.role = invite.role;
    dto.createdAt = invite.createdAt;
    return dto;
  }
}
