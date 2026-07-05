import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Precisamos revisar o prazo desta tarefa (editado)' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
