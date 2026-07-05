import { useEffect, useState } from 'react';
import * as tasksApi from '../../../services/tasksApi';
import type { ActivityLog, Member } from '../../../shared/types/api';
import { Avatar } from '../../../shared/components/Avatar';
import { EmptyState } from '../../../shared/components/EmptyState';
import { relativeTime } from '../utils/relativeTime';
import styles from './ActivityPanel.module.css';

interface ActivityPanelProps {
  taskId: string;
  membersById: Map<string, Member>;
}

export function ActivityPanel({ taskId, membersById }: ActivityPanelProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    tasksApi.getTaskActivity(taskId).then((result) => {
      setLogs([...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
  }, [taskId]);

  if (logs.length === 0) {
    return <EmptyState title="Sem atividade registrada ainda." />;
  }

  return (
    <div className={styles.list}>
      {logs.map((log) => {
        const actor = membersById.get(log.userId);
        return (
          <div key={log.id} className={styles.item}>
            <Avatar name={actor?.name} size={26} />
            <p className={styles.text}>
              <span className={styles.actor}>{actor?.name ?? 'Usuário'}</span> {log.action.toLowerCase()}
              <span className={styles.time}>{relativeTime(log.createdAt)}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
