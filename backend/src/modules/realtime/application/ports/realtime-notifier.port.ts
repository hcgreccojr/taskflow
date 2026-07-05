export const REALTIME_NOTIFIER = Symbol('REALTIME_NOTIFIER');

export type BoardEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.moved'
  | 'task.deleted'
  | 'column.created'
  | 'column.deleted'
  | 'column.reordered';

export interface BoardEvent {
  type: BoardEventType;
  payload: unknown;
}

export interface RealtimeNotifier {
  /** Notifica todos os clientes conectados à room de um quadro sobre um evento. */
  notifyBoardEvent(boardId: string, event: BoardEvent): void;
}
