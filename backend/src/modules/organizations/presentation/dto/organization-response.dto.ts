import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../domain/organization.entity';
import { MembershipRole } from '../../domain/membership.entity';

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: Date;

  /** Papel do requisitante nesta organização. Presente em list/create; ausente em update (o cliente já sabe o papel). */
  @ApiPropertyOptional({ enum: MembershipRole })
  role?: MembershipRole;

  static fromDomain(organization: Organization, role?: MembershipRole): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.ownerId = organization.ownerId;
    dto.createdAt = organization.createdAt;
    dto.role = role;
    return dto;
  }
}
