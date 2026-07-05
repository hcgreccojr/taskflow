import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : styles.ghost;
  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      {...rest}
    />
  );
}
