import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = 'text', className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn('playground-text', className)}
      {...props}
    />
  );
});
