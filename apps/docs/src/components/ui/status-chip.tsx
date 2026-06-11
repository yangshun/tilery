import { cn } from '../../lib/cn';

type StatusTone = 'success' | 'danger' | 'neutral';

export type StatusChipProps = {
  tone: StatusTone;
  label: string;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  success: 'border-site-success-border bg-site-success-bg text-site-success-fg',
  danger: 'border-site-danger-border bg-site-danger-bg text-site-danger-fg',
  neutral: 'bg-site-surface text-site-muted',
};

export function StatusChip({ tone, label, className }: StatusChipProps) {
  return (
    <div
      className={cn(
        'inline-flex min-h-8 items-center px-2.5 border border-site-border rounded-md text-site-fg text-sm font-semibold',
        toneClasses[tone],
        className,
      )}>
      {label}
    </div>
  );
}
