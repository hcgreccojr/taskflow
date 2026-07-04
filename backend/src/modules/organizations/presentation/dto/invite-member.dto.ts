import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from '../../domain/membership.entity';

export class InviteMemberDto {
  @ApiProperty({ example: 'colega@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: MembershipRole, required: false, default: MembershipRole.MEMBER })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
