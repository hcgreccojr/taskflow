import { useToastStore } from '../store/toastStore';
import styles from './Toast.module.css';

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${toast.variant === 'error' ? styles.error : ''}`}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
