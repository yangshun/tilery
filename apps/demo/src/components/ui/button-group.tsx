import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './button-group.module.css';

export type ButtonGroupProps = {
  children: ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return <div className={cn(styles.root, className)}>{children}</div>;
}
