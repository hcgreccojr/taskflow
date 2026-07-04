import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  providers: [{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
