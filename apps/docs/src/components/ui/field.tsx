import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type FieldProps = {
  label: string;
  hint?: string;
  control: ReactNode;
  className?: string;
};

export function Field({ label, hint, control, className }: FieldProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="min-w-0 flex flex-col gap-px">
        <span className="text-[13px]">{label}</span>
        {hint ? (
          <span className="text-[11px] text-site-fg/48">{hint}</span>
        ) : null}
      </div>
      <div className="shrink-0 flex items-center">{control}</div>
    </div>
  );
}
