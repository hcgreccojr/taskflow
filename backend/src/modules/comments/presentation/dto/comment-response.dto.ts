import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../../domain/comment.entity';

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  authorId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(comment: Comment): CommentResponseDto {
    const dto = new CommentResponseDto();
    dto.id = comment.id;
    dto.taskId = comment.taskId;
    dto.authorId = comment.authorId;
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;
    return dto;
  }
}
