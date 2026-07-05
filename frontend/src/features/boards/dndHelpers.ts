import type { Active, Over } from '@dnd-kit/core';
import type { Column, Task } from '../../shared/types/api';

export type DragAction =
  | { type: 'moveTask'; taskId: string; fromColumnId: string; toColumnId: string; order: number }
  | { type: 'reorderColumn'; columnId: string; order: number };

interface DragEndLike {
  active: Active;
  over: Over | null;
}

/**
 * Traduz o evento onDragEnd do dnd-kit em uma ação de negócio (mover tarefa ou
 * reordenar coluna). Extraído como função pura para ser testável sem simular
 * eventos reais de drag no DOM.
 */
export function resolveDragEnd(
  event: DragEndLike,
  columns: Column[],
  tasksByColumn: Record<string, Task[]>,
): DragAction | null {
  const { active, over } = event;
  if (!over) return null;

  const activeData = active.data.current as { type?: string; columnId?: string } | undefined;
  const overData = over.data.current as { type?: string; columnId?: string } | undefined;

  // A coluna (cabeçalho arrastável) e a sua dropzone de tarefas são regiões
  // droppable aninhadas (uma dentro da outra) — o dnd-kit pode resolver `over`
  // para qualquer uma das duas dependendo da posição exata do ponteiro. Por
  // isso ambos os ramos abaixo tratam 'column' e 'column-dropzone' como
  // equivalentes ao invés de depender de qual delas foi de fato resolvida.

  if (activeData?.type === 'column') {
    const targetColumnId = overData?.type === 'column' ? String(over.id) : overData?.columnId;
    if (!targetColumnId) return null;
    const newIndex = columns.findIndex((column) => column.id === targetColumnId);
    if (newIndex === -1) return null;
    return { type: 'reorderColumn', columnId: String(active.id), order: newIndex };
  }

  if (activeData?.type === 'task' && activeData.columnId) {
    const fromColumnId = activeData.columnId;

    if (overData?.type === 'task' && overData.columnId) {
      const toColumnId = overData.columnId;
      const targetTasks = tasksByColumn[toColumnId] ?? [];
      const overIndex = targetTasks.findIndex((task) => task.id === over.id);
      return {
        type: 'moveTask',
        taskId: String(active.id),
        fromColumnId,
        toColumnId,
        order: overIndex === -1 ? targetTasks.length : overIndex,
      };
    }

    if (overData?.type === 'column-dropzone' && overData.columnId) {
      return {
        type: 'moveTask',
        taskId: String(active.id),
        fromColumnId,
        toColumnId: overData.columnId,
        order: (tasksByColumn[overData.columnId] ?? []).length,
      };
    }

    if (overData?.type === 'column') {
      const toColumnId = String(over.id);
      return {
        type: 'moveTask',
        taskId: String(active.id),
        fromColumnId,
        toColumnId,
        order: (tasksByColumn[toColumnId] ?? []).length,
      };
    }
  }

  return null;
}
