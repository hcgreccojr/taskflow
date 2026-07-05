import type { TaskPriority } from '../types/api';
import styles from './PriorityPill.module.css';

const LABELS: Record<TaskPriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const CLASS_NAMES: Record<TaskPriority, string> = {
  HIGH: styles.high,
  MEDIUM: styles.medium,
  LOW: styles.low,
};

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`${styles.pill} ${CLASS_NAMES[priority]}`}>
      <span className={styles.dot} />
      {LABELS[priority]}
    </span>
  );
}
