import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController],
  providers: [{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
