import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ description: 'Filtra pelo responsável pela tarefa' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filtra pela coluna (estágio) exata da tarefa' })
  @IsOptional()
  @IsUUID()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtra tarefas com prazo até esta data' })
  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @ApiPropertyOptional({ description: 'Busca por título (contains, case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;
}
