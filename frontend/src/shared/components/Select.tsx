import type { SelectHTMLAttributes } from 'react';
import styles from './formControls.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, id, className = '', children, ...rest }: SelectProps) {
  const select = (
    <select id={id} className={`${styles.select} ${className}`} {...rest}>
      {children}
    </select>
  );

  if (!label) return select;

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      {select}
    </label>
  );
}
