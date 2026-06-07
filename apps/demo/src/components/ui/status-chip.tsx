type StatusTone = 'success' | 'danger' | 'neutral';

export type StatusChipProps = {
  tone: StatusTone;
  label: string;
  className?: string;
};

export function StatusChip({ tone, label, className }: StatusChipProps) {
  return (
    <div
      className={className ? `design-status ${className}` : `design-status design-status--${tone}`}>
      {label}
    </div>
  );
}
