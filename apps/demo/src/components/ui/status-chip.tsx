import { cn } from '../../lib/cn';
import styles from './status-chip.module.css';

type StatusTone = 'success' | 'danger' | 'neutral';

export type StatusChipProps = {
  tone: StatusTone;
  label: string;
  className?: string;
};

export function StatusChip({ tone, label, className }: StatusChipProps) {
  return (
    <div className={cn(styles.status, styles[`status--${tone}`], className)}>
      {label}
    </div>
  );
}
