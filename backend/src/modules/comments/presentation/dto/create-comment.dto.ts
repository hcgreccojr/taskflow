import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Precisamos revisar o prazo desta tarefa' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
