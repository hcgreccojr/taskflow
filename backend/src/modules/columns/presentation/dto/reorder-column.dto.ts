import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ReorderColumnDto {
  @ApiProperty({ example: 0, description: 'Posição alvo da coluna dentro do quadro (0-based)' })
  @IsInt()
  @Min(0)
  order!: number;
}
