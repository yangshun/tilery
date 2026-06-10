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
      className={cn(
        'h-7 px-2 border border-site-shell-border rounded-[6px] bg-site-bg text-site-fg text-[12.5px] font-[inherit]',
        className,
      )}
      {...props}
    />
  );
});
