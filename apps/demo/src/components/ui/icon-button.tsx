import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import styles from './icon-button.module.css';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ type = 'button', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(styles.iconButton, className)}
        {...props}
      />
    );
  },
);
