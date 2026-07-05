import type { TextareaHTMLAttributes } from 'react';
import styles from './formControls.module.css';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, id, className = '', ...rest }: TextAreaProps) {
  const textarea = <textarea id={id} className={`${styles.textarea} ${className}`} {...rest} />;

  if (!label) return textarea;

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      {textarea}
    </label>
  );
}
