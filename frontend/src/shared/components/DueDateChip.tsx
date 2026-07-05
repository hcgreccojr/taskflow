import styles from './DueDateChip.module.css';

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function DueDateChip({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  const variant = hoursUntilDue < 0 ? styles.overdue : hoursUntilDue <= 24 ? styles.warn : styles.ok;

  return <span className={`${styles.chip} ${variant}`}>{formatDate(due)}</span>;
}
