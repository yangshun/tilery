import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import styles from './input.module.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = 'text', className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(styles.input, className)}
      {...props}
    />
  );
});
