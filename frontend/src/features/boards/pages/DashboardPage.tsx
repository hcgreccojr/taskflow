import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBoardsStore } from '../store/boardsStore';
import { useOrganizationsStore } from '../../organizations/store/organizationsStore';
import * as columnsApi from '../../../services/columnsApi';
import * as tasksApi from '../../../services/tasksApi';
import { Topbar } from '../../../shared/components/Topbar';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import { useToastStore } from '../../../shared/store/toastStore';
import { ApiError } from '../../../services/httpClient';
import { emptyArray } from '../../../shared/utils/emptyArray';
import type { Board, Member } from '../../../shared/types/api';
import styles from './DashboardPage.module.css';

interface TaskStats {
  total: number;
  overdue: number;
}

export function DashboardPage() {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const boards = useBoardsStore((state) => state.boardsByOrg[orgId] ?? emptyArray<Board>());
  const fetchBoards = useBoardsStore((state) => state.fetchBoards);
  const createBoard = useBoardsStore((state) => state.createBoard);
  const members = useOrganizationsStore((state) => state.membersByOrg[orgId] ?? emptyArray<Member>());
  const fetchMembers = useOrganizationsStore((state) => state.fetchMembers);
  const pushToast = useToastStore((state) => state.push);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, overdue: 0 });

  useEffect(() => {
    if (!orgId) return;
    async function load() {
      try {
        await fetchBoards(orgId);
        await fetchMembers(orgId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          pushToast('Você não tem mais acesso a esta organização.', 'error');
          navigate('/orgs');
        }
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, fetchBoards, fetchMembers]);

  useEffect(() => {
    if (boards.length === 0) {
      setTaskStats({ total: 0, overdue: 0 });
      return;
    }
    let cancelled = false;
    (async () => {
      const columnLists = await Promise.all(boards.map((board) => columnsApi.listColumns(board.id)));
      const columnIds = new Set(columnLists.flat().map((column) => column.id));
      const allTasks = await tasksApi.listTasks({});
      if (cancelled) return;
      const orgTasks = allTasks.filter((task) => columnIds.has(task.columnId));
      const now = Date.now();
      const overdue = orgTasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < now);
      setTaskStats({ total: orgTasks.length, overdue: overdue.length });
    })();
    return () => {
      cancelled = true;
    };
  }, [boards]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await createBoard(orgId, name.trim());
    setName('');
    setCreating(false);
    pushToast('Quadro criado');
  }

  return (
    <div>
      <Topbar organizationId={orgId} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quadros</h1>
        </div>
        <p className={styles.subtitle}>Acompanhe o progresso dos times da sua organização.</p>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{boards.length}</div>
            <div className={styles.statLabel}>Quadros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{taskStats.total}</div>
            <div className={styles.statLabel}>Tarefas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{members.length}</div>
            <div className={styles.statLabel}>Membros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{taskStats.overdue}</div>
            <div className={styles.statLabel}>Atrasadas</div>
          </div>
        </div>

        {creating && (
          <form className={styles.createForm} onSubmit={onCreate}>
            <TextField
              placeholder="Nome do quadro"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
            <Button type="submit">Criar</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </form>
        )}

        <div className={styles.grid}>
          {boards.map((board) => (
            <Link key={board.id} to={`/orgs/${orgId}/boards/${board.id}`} className={styles.card}>
              <div className={styles.accentBar} />
              <div className={styles.cardName}>{board.name}</div>
              <div className={styles.cardDescription}>{board.description}</div>
            </Link>
          ))}
          {!creating && (
            <button type="button" className={styles.newCard} onClick={() => setCreating(true)}>
              + Novo quadro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
