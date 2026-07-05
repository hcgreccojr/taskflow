import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '../../domain/membership.entity';
import { MemberWithUser } from '../../application/use-cases/list-members.use-case';

export class MemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ enum: MembershipRole })
  role!: MembershipRole;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  static fromDomain({ membership, user }: MemberWithUser): MemberResponseDto {
    const dto = new MemberResponseDto();
    dto.id = membership.id;
    dto.userId = membership.userId;
    dto.organizationId = membership.organizationId;
    dto.role = membership.role;
    dto.name = user.name;
    dto.email = user.email;
    return dto;
  }
}
