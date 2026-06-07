import type { ReactNode } from 'react';

export type FieldProps = {
  label: string;
  hint?: string;
  control: ReactNode;
  className?: string;
};

export function Field({ label, hint, control, className }: FieldProps) {
  return (
    <div className={className ?? 'playground-row'}>
      <div className="playground-row__text">
        <span className="playground-row__label">{label}</span>
        {hint ? <span className="playground-row__hint">{hint}</span> : null}
      </div>
      <div className="playground-row__control">{control}</div>
    </div>
  );
}
