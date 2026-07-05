import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { COMMENT_REPOSITORY } from './application/ports/comment-repository.port';
import { PrismaCommentRepository } from './infrastructure/prisma-comment.repository';
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
import { ListCommentsUseCase } from './application/use-cases/list-comments.use-case';
import { UpdateCommentUseCase } from './application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [TasksModule],
  controllers: [CommentsController],
  providers: [
    { provide: COMMENT_REPOSITORY, useClass: PrismaCommentRepository },
    CreateCommentUseCase,
    ListCommentsUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
  ],
})
export class CommentsModule {}
