import { ApiProperty } from '@nestjs/swagger';
import { Organization } from '../../domain/organization.entity';

export class OrganizationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(organization: Organization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.ownerId = organization.ownerId;
    dto.createdAt = organization.createdAt;
    return dto;
  }
}
