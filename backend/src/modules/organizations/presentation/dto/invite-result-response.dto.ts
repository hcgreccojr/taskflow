import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipResponseDto } from './membership-response.dto';
import { PendingInviteResponseDto } from './pending-invite-response.dto';

export class InviteResultResponseDto {
  @ApiProperty({
    enum: ['joined', 'pending'],
    description:
      '"joined": o e-mail já tinha conta e virou membro. "pending": e-mail sem conta — vira ' +
      'membro automaticamente assim que se cadastrar com este e-mail.',
  })
  status!: 'joined' | 'pending';

  @ApiPropertyOptional({ type: MembershipResponseDto })
  membership?: MembershipResponseDto;

  @ApiPropertyOptional({ type: PendingInviteResponseDto })
  invite?: PendingInviteResponseDto;
}
