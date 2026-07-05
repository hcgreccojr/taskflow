import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ description: 'Coluna de destino' })
  @IsUUID()
  columnId!: string;

  @ApiPropertyOptional({ example: 0, description: 'Posição alvo dentro da coluna de destino (0-based)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
