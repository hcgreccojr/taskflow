import styles from './Avatar.module.css';

interface AvatarProps {
  name?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 28 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (!name) {
    return (
      <span className={`${styles.avatar} ${styles.empty}`} style={style} title="Sem responsável">
        ?
      </span>
    );
  }

  return (
    <span className={styles.avatar} style={style} title={name}>
      {initials(name)}
    </span>
  );
}
