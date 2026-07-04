import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Column } from '../domain/column.entity';
import {
  ColumnOrderUpdate,
  ColumnRepository,
  CreateColumnData,
} from '../application/ports/column-repository.port';

@Injectable()
export class PrismaColumnRepository implements ColumnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateColumnData): Promise<Column> {
    const row = await this.prisma.column.create({
      data: { boardId: data.boardId, name: data.name, order: data.order },
    });
    return this.toDomain(row);
  }

  async findById(id: string): Promise<Column | null> {
    const row = await this.prisma.column.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBoardId(boardId: string): Promise<Column[]> {
    const rows = await this.prisma.column.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async updateOrders(updates: ColumnOrderUpdate[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, order }) => this.prisma.column.update({ where: { id }, data: { order } })),
    );
  }

  private toDomain(row: { id: string; boardId: string; name: string; order: number }): Column {
    return new Column(row.id, row.boardId, row.name, row.order);
  }
}
