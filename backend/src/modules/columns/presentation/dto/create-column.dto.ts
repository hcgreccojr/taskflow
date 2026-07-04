import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'A Fazer' })
  @IsString()
  name!: string;
}
