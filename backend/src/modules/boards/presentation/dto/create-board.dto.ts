import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty()
  @IsString()
  organizationId!: string;

  @ApiProperty({ example: 'Sprint 1' })
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
