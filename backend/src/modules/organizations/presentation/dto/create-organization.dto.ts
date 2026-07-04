import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Minha Empresa' })
  @IsString()
  name!: string;
}
