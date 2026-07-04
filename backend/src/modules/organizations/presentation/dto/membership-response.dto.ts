import { ApiProperty } from '@nestjs/swagger';
import { Membership, MembershipRole } from '../../domain/membership.entity';

export class MembershipResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ enum: MembershipRole })
  role!: MembershipRole;

  static fromDomain(membership: Membership): MembershipResponseDto {
    const dto = new MembershipResponseDto();
    dto.id = membership.id;
    dto.userId = membership.userId;
    dto.organizationId = membership.organizationId;
    dto.role = membership.role;
    return dto;
  }
}
