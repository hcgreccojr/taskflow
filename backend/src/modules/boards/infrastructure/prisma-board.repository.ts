import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Board } from '../domain/board.entity';
import { BoardRepository, CreateBoardData, UpdateBoardData } from '../application/ports/board-repository.port';

@Injectable()
export class PrismaBoardRepository implements BoardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBoardData): Promise<Board> {
    const row = await this.prisma.board.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Board | null> {
    const row = await this.prisma.board.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Board[]> {
    const rows = await this.prisma.board.findMany({ where: { organizationId } });
    return rows.map((row) => this.toDomain(row));
  }

  async update(id: string, data: UpdateBoardData): Promise<Board> {
    const row = await this.prisma.board.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    // Board->Column e Column->Task não têm onDelete: Cascade no schema (de
    // propósito, por causa da RN-004) — a exclusão em cascata é feita aqui,
    // em transação. Comment/ActivityLog já cascateiam a partir de Task.
    await this.prisma.$transaction([
      this.prisma.task.deleteMany({ where: { column: { boardId: id } } }),
      this.prisma.column.deleteMany({ where: { boardId: id } }),
      this.prisma.board.delete({ where: { id } }),
    ]);
  }

  private toDomain(row: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
  }): Board {
    return new Board(row.id, row.organizationId, row.name, row.description);
  }
}
