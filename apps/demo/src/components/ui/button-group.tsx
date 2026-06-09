import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonGroupProps = {
  children: ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>{children}</div>
  );
}
