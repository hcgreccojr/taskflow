import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoardsStore } from '../store/boardsStore';
import { useOrganizationsStore } from '../../organizations/store/organizationsStore';
import { resolveDragEnd } from '../dndHelpers';
import { ColumnComponent } from '../components/ColumnComponent';
import { FilterBar } from '../components/FilterBar';
import type { BoardFilters } from '../components/FilterBar';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';
import { Avatar } from '../../../shared/components/Avatar';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../shared/store/toastStore';
import { emptyArray } from '../../../shared/utils/emptyArray';
import type { Column, Member } from '../../../shared/types/api';
import styles from './BoardPage.module.css';

const EMPTY_FILTERS: BoardFilters = { search: '', assigneeId: '', priority: '' };

export function BoardPage() {
  const { orgId = '', boardId = '' } = useParams();

  const board = useBoardsStore((state) => state.boardsByOrg[orgId]?.find((b) => b.id === boardId));
  const fetchBoards = useBoardsStore((state) => state.fetchBoards);
  const columns = useBoardsStore((state) => state.columnsByBoard[boardId] ?? emptyArray<Column>());
  const tasksByColumn = useBoardsStore((state) => state.tasksByColumn);
  const fetchBoardData = useBoardsStore((state) => state.fetchBoardData);
  const createTask = useBoardsStore((state) => state.createTask);
  const createColumn = useBoardsStore((state) => state.createColumn);
  const moveTask = useBoardsStore((state) => state.moveTask);
  const reorderColumns = useBoardsStore((state) => state.reorderColumns);

  const members = useOrganizationsStore((state) => state.membersByOrg[orgId] ?? emptyArray<Member>());
  const fetchMembers = useOrganizationsStore((state) => state.fetchMembers);
  const pushToast = useToastStore((state) => state.push);

  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  useEffect(() => {
    if (!board) fetchBoards(orgId);
    fetchBoardData(boardId);
    fetchMembers(orgId);
  }, [orgId, boardId, board, fetchBoards, fetchBoardData, fetchMembers]);

  const membersById = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members]);

  const filteredTasksByColumn = useMemo(() => {
    const result: typeof tasksByColumn = {};
    for (const column of columns) {
      const tasks = tasksByColumn[column.id] ?? [];
      result[column.id] = tasks.filter((task) => {
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        return true;
      });
    }
    return result;
  }, [columns, tasksByColumn, filters]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const action = resolveDragEnd(event, columns, tasksByColumn);
    if (!action) return;

    try {
      if (action.type === 'reorderColumn') {
        await reorderColumns(boardId, action.columnId, action.order);
      } else {
        await moveTask(action.taskId, action.fromColumnId, action.toColumnId, action.order);
      }
    } catch {
      pushToast('Não foi possível concluir a movimentação', 'error');
    }
  }

  async function onAddColumn() {
    if (!newColumnName.trim()) return;
    await createColumn(boardId, newColumnName.trim());
    setNewColumnName('');
    setAddingColumn(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link to={`/orgs/${orgId}`} className={styles.breadcrumb}>
            ← Quadros
          </Link>
          <div className={styles.boardName}>{board?.name}</div>
          {board?.description && <div className={styles.boardDescription}>{board.description}</div>}
        </div>
        <div className={styles.headerRight}>
          <div className={styles.avatarStack}>
            {members.slice(0, 5).map((member) => (
              <Avatar key={member.userId} name={member.name} size={30} />
            ))}
          </div>
          <Link to={`/orgs/${orgId}/members`}>
            <Button variant="ghost">Gerenciar membros</Button>
          </Link>
        </div>
      </div>

      <FilterBar filters={filters} members={members} onChange={setFilters} />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className={styles.columnsArea}>
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <ColumnComponent
                key={column.id}
                column={column}
                tasks={filteredTasksByColumn[column.id] ?? []}
                membersById={membersById}
                onOpenTask={setSelectedTaskId}
                onCreateTask={(columnId, title) => createTask(columnId, { title })}
              />
            ))}
          </SortableContext>

          {addingColumn ? (
            <div className={styles.addColumn}>
              <input
                autoFocus
                placeholder="Nome da coluna"
                value={newColumnName}
                onChange={(event) => setNewColumnName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && onAddColumn()}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button onClick={onAddColumn}>Adicionar</Button>
                <Button variant="ghost" onClick={() => setAddingColumn(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.addColumn} onClick={() => setAddingColumn(true)}>
              + Nova coluna
            </button>
          )}
        </div>
      </DndContext>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          columns={columns}
          members={members}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
