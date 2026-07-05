import type { InputHTMLAttributes } from 'react';
import styles from './formControls.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function TextField({ label, id, className = '', ...rest }: TextFieldProps) {
  const input = <input id={id} className={`${styles.input} ${className}`} {...rest} />;

  if (!label) return input;

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      {input}
    </label>
  );
}
