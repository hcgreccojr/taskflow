import { Board } from '../../domain/board.entity';

export const BOARD_REPOSITORY = Symbol('BOARD_REPOSITORY');

export interface CreateBoardData {
  organizationId: string;
  name: string;
  description?: string;
}

export interface BoardRepository {
  create(data: CreateBoardData): Promise<Board>;
  findById(id: string): Promise<Board | null>;
  findByOrganizationId(organizationId: string): Promise<Board[]>;
}
