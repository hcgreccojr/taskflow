import { useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ onClose, children, maxWidth = 820 }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.card} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
