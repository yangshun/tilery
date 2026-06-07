import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonGroupProps = {
  children: ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn('playground-btn-grid', className)}>{children}</div>
  );
}
