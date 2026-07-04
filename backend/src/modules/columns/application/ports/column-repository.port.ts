import { Column } from '../../domain/column.entity';

export const COLUMN_REPOSITORY = Symbol('COLUMN_REPOSITORY');

export interface CreateColumnData {
  boardId: string;
  name: string;
  order: number;
}

export interface ColumnOrderUpdate {
  id: string;
  order: number;
}

export interface ColumnRepository {
  create(data: CreateColumnData): Promise<Column>;
  findById(id: string): Promise<Column | null>;
  /** Ordenadas por `order` ascendente. */
  findByBoardId(boardId: string): Promise<Column[]>;
  /** Persiste o novo `order` de todas as colunas informadas numa única transação. */
  updateOrders(updates: ColumnOrderUpdate[]): Promise<void>;
}
