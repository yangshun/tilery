import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './field.module.css';

export type FieldProps = {
  label: string;
  hint?: string;
  control: ReactNode;
  className?: string;
};

export function Field({ label, hint, control, className }: FieldProps) {
  return (
    <div className={cn(styles.row, className)}>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {hint ? <span className={styles.rowHint}>{hint}</span> : null}
      </div>
      <div className={styles.rowControl}>{control}</div>
    </div>
  );
}
