import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { TokenPayload } from '../../auth/application/ports/token.service.port';
import { CreateOrganizationUseCase } from '../application/use-cases/create-organization.use-case';
import { ListOrganizationsUseCase } from '../application/use-cases/list-organizations.use-case';
import { InviteMemberUseCase } from '../application/use-cases/invite-member.use-case';
import { ListMembersUseCase } from '../application/use-cases/list-members.use-case';
import { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { InviteResultResponseDto } from './dto/invite-result-response.dto';
import { PendingInviteResponseDto } from './dto/pending-invite-response.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar organizações do usuário' })
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  async list(@CurrentUser() user: TokenPayload): Promise<OrganizationResponseDto[]> {
    const organizations = await this.listOrganizationsUseCase.execute(user.sub);
    return organizations.map(OrganizationResponseDto.fromDomain);
  }

  @Post()
  @ApiOperation({ summary: 'Criar organização (o criador vira ADMIN automaticamente)' })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
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
  @ApiOperation({
    summary:
      'Convidar membro para a organização (apenas ADMIN). Se o e-mail ainda não tiver conta, ' +
      'cria um convite pendente que se torna membro automaticamente no cadastro (RN-002).',
  })
  @ApiCreatedResponse({ type: InviteResultResponseDto })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro ou não é ADMIN da organização' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro desta organização' })
  async invite(
    @CurrentUser() user: TokenPayload,
    @Param('id') organizationId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<InviteResultResponseDto> {
    const result = await this.inviteMemberUseCase.execute({
      requesterId: user.sub,
      organizationId,
      email: dto.email,
      role: dto.role,
    });

    if (result.status === 'joined') {
      return { status: 'joined', membership: MembershipResponseDto.fromDomain(result.membership) };
    }
    return { status: 'pending', invite: PendingInviteResponseDto.fromDomain(result.invite) };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros de uma organização' })
  @ApiOkResponse({ type: MemberResponseDto, isArray: true })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro da organização' })
  async listMembers(
    @CurrentUser() user: TokenPayload,
    @Param('id') organizationId: string,
  ): Promise<MemberResponseDto[]> {
    const members = await this.listMembersUseCase.execute({
      requesterId: user.sub,
      organizationId,
    });
    return members.map(MemberResponseDto.fromDomain);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remover membro da organização (apenas ADMIN)' })
  @ApiResponse({ status: 200, description: 'Membro removido' })
  @ApiResponse({ status: 403, description: 'Requisitante não é membro ou não é ADMIN da organização' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado nesta organização' })
  async removeMember(
    @CurrentUser() user: TokenPayload,
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.removeMemberUseCase.execute({
      requesterId: user.sub,
      organizationId,
      membershipId: memberId,
    });
  }
}
