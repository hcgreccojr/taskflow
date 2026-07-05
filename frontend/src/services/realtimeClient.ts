import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './httpClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(`${BASE_URL}/realtime`, {
      auth: { token: getAccessToken() },
      autoConnect: true,
    });
  }
  return socket;
}

/** Entra na room do quadro; chama `onEvent` a cada evento recebido enquanto conectado. */
export function joinBoard(boardId: string, onEvent: () => void): () => void {
  const client = getSocket();
  client.emit('join-board', { boardId });
  client.on('board-event', onEvent);

  return () => {
    client.emit('leave-board', { boardId });
    client.off('board-event', onEvent);
  };
}
