import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { User } from '../domain/user.entity';
import { CreateUserData, UserRepository } from '../application/ports/user-repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({ data });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): User {
    return new User(row.id, row.name, row.email, row.passwordHash, row.createdAt);
  }
}
