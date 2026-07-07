import { Board } from '../../domain/board.entity';

export const BOARD_REPOSITORY = Symbol('BOARD_REPOSITORY');

export interface CreateBoardData {
  organizationId: string;
  name: string;
  description?: string;
}

export interface UpdateBoardData {
  name?: string;
  description?: string | null;
}

export interface BoardRepository {
  create(data: CreateBoardData): Promise<Board>;
  findById(id: string): Promise<Board | null>;
  findByOrganizationId(organizationId: string): Promise<Board[]>;
  update(id: string, data: UpdateBoardData): Promise<Board>;
  /** Apaga o quadro e, em cascata (aplicação, não FK), suas colunas e tarefas. */
  delete(id: string): Promise<void>;
}
