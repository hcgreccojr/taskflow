import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateOrganizationUseCase } from '../application/use-cases/create-organization.use-case';
import { ListOrganizationsUseCase } from '../application/use-cases/list-organizations.use-case';
import { InviteMemberUseCase } from '../application/use-cases/invite-member.use-case';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: TokenPayload): Promise<OrganizationResponseDto[]> {
    const organizations = await this.listOrganizationsUseCase.execute(user.sub);
    return organizations.map(OrganizationResponseDto.fromDomain);
  }

  @Post()
  async create(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.createOrganizationUseCase.execute({
      name: dto.name,
      ownerId: user.sub,
    });
    return OrganizationResponseDto.fromDomain(organization);
  }

  @Post(':id/invites')
  async invite(
    @CurrentUser() user: TokenPayload,
    @Param('id') organizationId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<MembershipResponseDto> {
    const membership = await this.inviteMemberUseCase.execute({
      requesterId: user.sub,
      organizationId,
      email: dto.email,
      role: dto.role,
    });
    return MembershipResponseDto.fromDomain(membership);
  }
}
