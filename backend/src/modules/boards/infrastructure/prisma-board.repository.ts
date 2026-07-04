import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Board } from '../domain/board.entity';
import { BoardRepository, CreateBoardData } from '../application/ports/board-repository.port';

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

  private toDomain(row: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
  }): Board {
    return new Board(row.id, row.organizationId, row.name, row.description);
  }
}
