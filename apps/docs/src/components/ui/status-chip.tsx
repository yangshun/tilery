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
        'inline-flex min-h-[30px] items-center px-2.5 border border-site-border rounded-[6px] text-site-fg text-[13px] font-semibold',
        toneClasses[tone],
        className,
      )}>
      {label}
    </div>
  );
}
